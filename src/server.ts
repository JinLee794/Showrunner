import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express from 'express';
import { Renderer } from './renderer/index.js';
import { BrowserPool } from './renderer/browser-pool.js';
import { handleRenderVideo, renderVideoTool } from './tools/render-video.js';
import { handleRenderScene, renderSceneTool } from './tools/render-scene.js';
import { handleValidateStoryboard, validateStoryboardTool } from './tools/validate-storyboard.js';
import { handlePreviewStoryboard, previewStoryboardTool } from './tools/preview-storyboard.js';
import { handleListSceneTypes, listSceneTypesTool } from './tools/list-scene-types.js';
import { handleRenderGif, renderGifTool } from './tools/render-gif.js';
import { handleSynthesizeNarration, synthesizeNarrationTool } from './tools/synthesize-narration.js';

const pool = new BrowserPool();
const renderer = new Renderer(pool);

function createServer(): McpServer {
  const server = new McpServer({
    name: 'showrunner',
    version: '0.1.0',
  });

  // render_video
  server.tool(
    renderVideoTool.name,
    renderVideoTool.description,
    {
      storyboard: z.record(z.unknown()),
      outputPath: z.string().optional(),
      quality: z.enum(['high', 'medium', 'fast']).optional(),
    },
    async (args) => handleRenderVideo(args, renderer)
  );

  // render_scene
  server.tool(
    renderSceneTool.name,
    renderSceneTool.description,
    {
      scene: z.record(z.unknown()),
      assets: z.record(z.string()).optional(),
      theme: z.string().optional(),
      resolution: z.array(z.number()).optional(),
      fps: z.number().optional(),
      outputPath: z.string().optional(),
    },
    async (args) => handleRenderScene(args, renderer)
  );

  // validate_storyboard
  server.tool(
    validateStoryboardTool.name,
    validateStoryboardTool.description,
    {
      storyboard: z.record(z.unknown()),
    },
    async (args) => handleValidateStoryboard(args)
  );

  // preview_storyboard
  server.tool(
    previewStoryboardTool.name,
    previewStoryboardTool.description,
    {
      storyboard: z.record(z.unknown()),
      outputPath: z.string().optional(),
    },
    async (args) => handlePreviewStoryboard(args)
  );

  // render_gif
  server.tool(
    renderGifTool.name,
    renderGifTool.description,
    {
      storyboard: z.record(z.unknown()),
      outputPath: z.string().optional(),
      quality: z.enum(['high', 'medium', 'fast']).optional(),
      width: z.number().optional(),
      speed: z.number().optional(),
      maxColors: z.number().optional(),
    },
    async (args) => handleRenderGif(args, renderer)
  );

  // list_scene_types
  server.tool(
    listSceneTypesTool.name,
    listSceneTypesTool.description,
    {},
    async () => handleListSceneTypes()
  );

  // synthesize_narration (Azure Speech TTS + transcript)
  server.tool(
    synthesizeNarrationTool.name,
    synthesizeNarrationTool.description,
    {
      storyboard: z.record(z.unknown()),
      audioOutputPath: z.string().optional(),
      transcriptBasePath: z.string().optional(),
    },
    async (args) => handleSynthesizeNarration(args)
  );

  return server;
}

async function main() {
  const transport = process.env.TRANSPORT || 'stdio';

  const server = createServer();

  if (transport === 'http') {
    const app = express();
    app.use(express.json());

    // Track sessions for stateful HTTP transport
    const sessions = new Map<string, StreamableHTTPServerTransport>();

    app.post('/mcp', async (req, res) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let httpTransport: StreamableHTTPServerTransport;

      if (sessionId && sessions.has(sessionId)) {
        httpTransport = sessions.get(sessionId)!;
      } else {
        httpTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
        });
        await server.connect(httpTransport);
        // Store session after connection so we can retrieve the generated ID
        httpTransport.onclose = () => {
          const sid = [...sessions.entries()].find(([, v]) => v === httpTransport)?.[0];
          if (sid) sessions.delete(sid);
        };
      }

      await httpTransport.handleRequest(req, res, req.body);

      // Store by session ID from response header
      const respSessionId = res.getHeader('mcp-session-id') as string | undefined;
      if (respSessionId && !sessions.has(respSessionId)) {
        sessions.set(respSessionId, httpTransport);
      }
    });

    app.get('/mcp', async (req, res) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (sessionId && sessions.has(sessionId)) {
        const httpTransport = sessions.get(sessionId)!;
        await httpTransport.handleRequest(req, res);
      } else {
        res.status(400).json({ error: 'No session. Send an initialize request first via POST /mcp.' });
      }
    });

    app.delete('/mcp', async (req, res) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (sessionId && sessions.has(sessionId)) {
        const httpTransport = sessions.get(sessionId)!;
        await httpTransport.handleRequest(req, res);
        sessions.delete(sessionId);
      } else {
        res.status(400).json({ error: 'No session found.' });
      }
    });

    app.get('/health', (_, res) => {
      res.json({ status: 'ok', browser: pool.isReady() });
    });

    const port = Number(process.env.PORT) || 8080;
    app.listen(port, () => {
      console.error(`Showrunner — HTTP transport on port ${port}`);
    });
  } else {
    // stdio transport
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    console.error('Showrunner — stdio transport ready');
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.error('Shutting down...');
    await renderer.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
