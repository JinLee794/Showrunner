#!/usr/bin/env bash
set -e

# Demonstration: synthesis-only workflow using the `synthesize_narration` MCP tool.
# 
# This shows how to:
# 1. Generate MP3 audio + VTT transcript without rendering video
# 2. Inspect word-boundary timings and per-scene synthesis metadata
# 3. Use the generated transcript for accessibility / search indexing
#
# Prerequisites:
#   - npm install microsoft-cognitiveservices-speech-sdk
#   - export AZURE_SPEECH_REGION=<region> AZURE_SPEECH_KEY=<key>
#
# Usage:
#   bash scripts/demo-narration-workflow.sh

STORYBOARD="fixtures/sql600-hls-readout-2026-04-16.json"
OUTPUT_DIR="output/narration-demo"

mkdir -p "$OUTPUT_DIR"

echo "=== Narration Synthesis Demo ==="
echo ""
echo "Input: $STORYBOARD"
echo "Output directory: $OUTPUT_DIR"
echo ""

# If running via the MCP server (stdio), you would call:
#   tool: synthesize_narration
#   args: {
#     "storyboard": <contents of $STORYBOARD>,
#     "audioOutputPath": "$OUTPUT_DIR/narration.mp3",
#     "transcriptBasePath": "$OUTPUT_DIR/narration"
#   }

# For demonstration via CLI (using internal tool):
echo "Synthesizing narration (requires Azure Speech SDK + credentials)..."
echo ""
echo "Expected output:"
echo "  ✅ $OUTPUT_DIR/narration.mp3      (concatenated audio)"
echo "  ✅ $OUTPUT_DIR/narration.vtt       (VTT transcript with word timings)"
echo "  📊 scene metadata (per-scene word count, audio duration, voice)"
echo ""

# In a real workflow, you'd:
#   1. Call synthesize_narration from your MCP client
#   2. Use the audio in parallel with video rendering (render_video auto-enables narration)
#   3. Check transcriptPath in the render result to find the VTT sidecar
#   4. Index the transcript for searchability

echo "To use this in your workflow:"
echo "  Option A: render_video with narration fields → auto-muxes audio + generates transcript"
echo "  Option B: synthesize_narration standalone → get audio + transcript for reuse"
echo ""
echo "See README.md 'Voice-over & Transcripts' section for full examples."
