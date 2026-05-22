import React, { useEffect, useRef, useState } from 'react';
import { 
  Globe, 
  FileImage, 
  Figma, 
  UploadCloud, 
  Sparkles, 
  AlertCircle,
  Binary,
  CheckCircle,
} from 'lucide-react';
import { GeneratedDocument, InputTabType, SamplePreset } from '../types';
import { SAMPLE_PRESETS } from '../data';
import type { GenerateRequest } from '../../../lib/types/api';
import type { DesignTokens } from '../../../lib/types/design-tokens';

interface InputWorkspaceProps {
  onGenerateDoc: (document: GeneratedDocument, preset?: SamplePreset, shouldFocusPreview?: boolean) => void;
  onGenerationStatusChange: (isGenerating: boolean) => void;
  isLoading: boolean;
  activePresetId: string;
}

export default function InputWorkspace({ onGenerateDoc, onGenerationStatusChange, isLoading, activePresetId }: InputWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<InputTabType>('SCREENSHOT');
  const [urlInput, setUrlInput] = useState('https://stripe.com/docs/billing/components/portal');
  const [figmaInput, setFigmaInput] = useState('https://figma.com/file/linear-v3-components-ui-kit');
  const [figmaToken, setFigmaToken] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedExampleId, setSelectedExampleId] = useState<string>('preset-linear-dark');
  const [isDragging, setIsDragging] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [figmaConnected, setFigmaConnected] = useState(false);
  const [figmaChecked, setFigmaChecked] = useState(false);
  
  // Progress states for generator sequence
  const [generationStage, setGenerationStage] = useState<'IDLE' | 'UPLOADING' | 'SCANNING' | 'BUILDING' | 'DONE'>('IDLE');
  const [stageProgress, setStageProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter examples according to tab type
  const tabExamples = SAMPLE_PRESETS.filter(p => p.tabType === activeTab);

  useEffect(() => {
    fetch('/api/auth/figma/token')
      .then(r => r.json())
      .then((status: { connected: boolean; hasToken: boolean }) => {
        setFigmaConnected(status.connected && status.hasToken);
        setFigmaChecked(true);
      })
      .catch(() => setFigmaChecked(true));
  }, []);

  const handleSelectExample = (preset: SamplePreset) => {
    setSelectedExampleId(preset.id);
    if (activeTab === 'URL') {
      setUrlInput(preset.inputValue);
    } else if (activeTab === 'FIGMA') {
      setFigmaInput(preset.inputValue);
    } else {
      setUploadedFile(null); // Clear manual upload, use example
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setUploadedFile(file);
        // Deselect preloaded example to prefer custom upload
        setSelectedExampleId('custom');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      setSelectedExampleId('custom');
    }
  };

  // Trigger the real generator while preserving the original staged UI.
  const handleGenerate = async () => {
    let presetToUse: SamplePreset | undefined;

    if (selectedExampleId === 'custom' || !selectedExampleId) {
      // If user uploaded custom file, map to standard sample or fallback
      // Find default screenshot example
      presetToUse = SAMPLE_PRESETS.find(p => p.tabType === activeTab) || SAMPLE_PRESETS[0];
    } else {
      presetToUse = SAMPLE_PRESETS.find(p => p.id === selectedExampleId);
    }

    if (!presetToUse) return;

    try {
      setGenerationError(null);
      setGenerationStage('UPLOADING');
      setStageProgress(20);
      const request = await buildGenerateRequest();
      onGenerationStatusChange(true);

      setGenerationStage('SCANNING');
      setStageProgress(45);
      let hasFocusedPreview = false;
      const result = await streamDesignMd(request, (partialRaw, tokens) => {
        setGenerationStage('BUILDING');
        setStageProgress((current) => Math.min(95, Math.max(current + 2, 65)));
        onGenerateDoc(buildGeneratedDocument(partialRaw, presetToUse, tokens), presetToUse, !hasFocusedPreview);
        hasFocusedPreview = true;
      });

      setGenerationStage('DONE');
      setStageProgress(100);
      onGenerateDoc(buildGeneratedDocument(result.raw, presetToUse, result.tokens), presetToUse, false);
      onGenerationStatusChange(false);

      setTimeout(() => {
        setGenerationStage('IDLE');
        setStageProgress(0);
      }, 650);
    } catch (error) {
      setGenerationStage('IDLE');
      setStageProgress(0);
      onGenerationStatusChange(false);
      setGenerationError(error instanceof Error ? error.message : 'Generation failed unexpectedly.');
    }
  };

  const buildGenerateRequest = async (): Promise<GenerateRequest> => {
    if (activeTab === 'URL') {
      return { inputType: 'url', websiteUrl: urlInput.trim() };
    }

    if (activeTab === 'FIGMA') {
      if (!figmaConnected && !figmaToken.trim()) {
        throw new Error('Connect your Figma account or paste a token before generating.');
      }

      return { inputType: 'figma', figmaUrl: figmaInput.trim(), figmaToken: figmaToken.trim() };
    }

    if (!uploadedFile) {
      throw new Error('Upload a screenshot before generating from an image.');
    }

    const imageBase64 = await fileToBase64(uploadedFile);
    return { inputType: 'image', imageBase64, imageMimeType: uploadedFile.type };
  };

  return (
    <section id="workspace" className="border-b border-border-match bg-surf-1 py-16 sm:py-20 relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Workspace Title Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-mono text-xs text-accent-pink uppercase tracking-widest block mb-2">Interactive Laboratory</span>
          <h2 className="font-pixel-square text-3xl sm:text-4xl text-text-white mb-4 uppercase tracking-tight">
            Design System Workspace
          </h2>
          <p className="font-geist text-sm text-muted-text">
            Provide a configuration source below to witness our Claude AI analysis engine extract functional visual tokens, grids, and markdown documentation in real-time.
          </p>
        </div>

        {/* Outer Workspace Shell Frame */}
        <div className="rounded-lg border border-border-match bg-bg-black overflow-hidden shadow-xl">
          
          {/* Workspace Tabs controller */}
          <div className="flex flex-col sm:flex-row border-b border-border-match bg-surf-2">
            
            <button
              onClick={() => {
                setActiveTab('SCREENSHOT');
                // Select first matching preset
                const pr = SAMPLE_PRESETS.find(p => p.tabType === 'SCREENSHOT');
                if (pr) setSelectedExampleId(pr.id);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-mono border-b sm:border-b-0 sm:border-r border-border-match transition-all cursor-pointer ${activeTab === 'SCREENSHOT' ? 'bg-bg-black text-accent-pink border-b-2 sm:border-b-2 border-b-accent-pink' : 'text-text-3 hover:text-text-1 bg-surf-2/60'}`}
            >
              <FileImage size={15} className="shrink-0" />
              <span>
                <span className="hidden md:inline">[01] </span>Screenshot<span className="hidden sm:inline"> Upload</span>
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('FIGMA');
                const pr = SAMPLE_PRESETS.find(p => p.tabType === 'FIGMA');
                if (pr) setSelectedExampleId(pr.id);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-mono border-b sm:border-b-0 sm:border-r border-border-match transition-all cursor-pointer ${activeTab === 'FIGMA' ? 'bg-bg-black text-accent-pink border-b-2 sm:border-b-2 border-b-accent-pink' : 'text-text-3 hover:text-text-1 bg-surf-2/60'}`}
            >
              <Figma size={15} className="shrink-0" />
              <span>
                <span className="hidden md:inline">[02] </span>Figma<span className="hidden sm:inline"> Resource</span>
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('URL');
                const pr = SAMPLE_PRESETS.find(p => p.tabType === 'URL');
                if (pr) setSelectedExampleId(pr.id);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-mono transition-all cursor-pointer ${activeTab === 'URL' ? 'bg-bg-black text-accent-pink border-b-2 sm:border-b-2 border-b-accent-pink' : 'text-text-3 hover:text-text-1 bg-surf-2/60'}`}
            >
              <Globe size={15} className="shrink-0" />
              <span>
                <span className="hidden md:inline">[03] </span>Link URL<span className="hidden sm:inline"> Address</span>
              </span>
            </button>

          </div>

          {/* Active Workspace Controls Body */}
          <div className="p-6">
            
            {/* 1. SCREENSHOT DROPZONE CONTENT */}
            {activeTab === 'SCREENSHOT' && (
              <div className="space-y-6">
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${isDragging ? 'border-accent-pink bg-accent-pink/5' : 'border-border-match hover:border-border-active bg-surf-6'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  
                  <div className="h-12 w-12 rounded-full border border-border-match bg-surf-2 flex items-center justify-center text-text-3">
                    <UploadCloud size={24} className={uploadedFile ? 'text-success-green' : 'text-accent-pink'} />
                  </div>

                  <div className="text-center">
                    {uploadedFile ? (
                      <div>
                        <p className="text-sm font-semibold text-text-white font-mono">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-[#3DD68C] mt-1 font-mono">
                          ✓ File selected successfully ({(uploadedFile.size / 1024).toFixed(1)} KB)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-text-1">
                          Drag and drop screenshot file here, or <span className="text-accent-pink underline">browse</span>
                        </p>
                        <p className="text-xs text-[#A0A0A0] mt-1">
                          Supports PNG, JPG, WebP up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. FIGMA SPECIFIC DESIGN CONTROLS */}
            {activeTab === 'FIGMA' && (
              <div className="space-y-4 text-left">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A0A0A0]">
                  Figma Component Frame/File Link
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-3">
                    <Figma size={16} />
                  </div>
                  <input
                    type="text"
                    value={figmaInput}
                    onChange={(e) => {
                      setFigmaInput(e.target.value);
                      setSelectedExampleId('custom');
                    }}
                    placeholder="https://figma.com/file/..."
                    className="w-full h-11 pl-10 pr-4 bg-surf-2 border border-border-match rounded text-xs font-mono text-text-1 focus:border-accent-pink focus:outline-none focus:ring-1 focus:ring-accent-pink transition-all"
                  />
                </div>

                {figmaChecked && !figmaConnected && !figmaToken && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => { window.location.href = '/api/auth/figma'; }}
                      className="flex items-center gap-2 rounded-md bg-accent-pink px-4 py-2 text-xs font-mono font-semibold text-black hover:bg-accent-pink/90 transition-all"
                    >
                      <Figma size={14} />
                      Connect Figma Account
                    </button>
                    <p className="text-xs text-text-3">
                      We never store your Figma data. Or{' '}
                      <button
                        type="button"
                        onClick={() => setFigmaToken(' ')}
                        className="underline text-text-3 hover:text-text-1"
                      >
                        use a token instead
                      </button>
                    </p>
                  </div>
                )}

                {figmaChecked && figmaConnected && (
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full border border-green-600/30 bg-green-600/10 px-3 py-1 text-xs font-mono font-medium text-green-400">
                      <CheckCircle size={12} />
                      Figma Connected
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch('/api/auth/figma/token', { method: 'DELETE' });
                        setFigmaConnected(false);
                      }}
                      className="text-xs text-text-3 underline hover:text-text-1"
                    >
                      Disconnect
                    </button>
                  </div>
                )}

                {(!figmaConnected || figmaToken.trim()) && (
                  <>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A0A0A0]">
                      Figma API Token
                    </label>
                    <input
                      type="password"
                      value={figmaToken}
                      onChange={(e) => setFigmaToken(e.target.value)}
                      placeholder="figd_..."
                      className="w-full h-11 px-4 bg-surf-2 border border-border-match rounded text-xs font-mono text-text-1 focus:border-accent-pink focus:outline-none focus:ring-1 focus:ring-accent-pink transition-all"
                    />
                  </>
                )}
              </div>
            )}

            {/* 3. URL SPECIFIC DESIGN CONTROLS */}
            {activeTab === 'URL' && (
              <div className="space-y-4 text-left">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A0A0A0]">
                  Live Website URL Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-3">
                    <Globe size={16} />
                  </div>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setSelectedExampleId('custom');
                    }}
                    placeholder="https://example.com/styling-assets"
                    className="w-full h-11 pl-10 pr-4 bg-surf-2 border border-[#2E2E2E] rounded text-xs font-mono text-text-1 focus:border-accent-pink focus:outline-none focus:ring-1 focus:ring-accent-pink transition-all"
                  />
                </div>
                <p className="text-xs text-text-3 leading-relaxed">
                  Fetches deep cascading stylesheet models, typography heights, relative padding, and visual button structures directly from the DOM root.
                </p>
              </div>
            )}

            {/* PRE-LOADED TEST EXAMPLES SELECTION PANEL */}
            <div className="mt-6 border-t border-border-match/50 pt-6 text-left">
              <span className="block text-xs font-mono uppercase tracking-wider text-text-3 mb-3">
                Or select high-fidelity sandbox examples to test:
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tabExamples.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectExample(preset)}
                    className={`p-3.5 rounded text-left border transition-all cursor-pointer ${selectedExampleId === preset.id ? 'bg-surf-3 border-accent-pink' : 'bg-surf-6 border-border-match hover:border-border-active'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-text-white tracking-tight">
                        {preset.title}
                      </span>
                      {selectedExampleId === preset.id && (
                        <span className="h-2 w-2 rounded-full bg-accent-pink" />
                      )}
                    </div>
                    <p className="text-xs text-muted-text leading-relaxed line-clamp-2 mt-1">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* PROCESSING STATE LOADER DISPLAY */}
            {generationStage !== 'IDLE' && (
              <div className="mt-6 bg-surf-2 border border-border-match p-4 rounded text-left space-y-3 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-text-white flex items-center gap-2">
                    <Binary size={14} className="animate-spin text-accent-pink" />
                    {generationStage === 'UPLOADING' && '[UPLOADING DESIGN RESOURCE...]'}
                    {generationStage === 'SCANNING' && '[DECODING GEOMETRY LAYOUT PARAMS...]'}
                    {generationStage === 'BUILDING' && '[COMPILING DOCUMENT: DESIGN.md...]'}
                    {generationStage === 'DONE' && '[EXTRACTION ACCU-TREE SINK COMPLETE]'}
                  </span>
                  <span className="text-xs text-accent-pink font-mono">{stageProgress}%</span>
                </div>
                
                {/* Micro-Progress Bar */}
                <div className="w-full bg-bg-black rounded-full h-1.5 overflow-hidden border border-border-match">
                  <div 
                    className="bg-accent-pink h-full rounded-full transition-all duration-300"
                    style={{ width: `${stageProgress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-mono text-text-3 gap-4">
                  <span>
                    {generationStage === 'UPLOADING' && 'Initializing canvas context vectors...'}
                    {generationStage === 'SCANNING' && 'Tracing font matrices, container coordinates, and swatches...'}
                    {generationStage === 'BUILDING' && 'Aligning tokens with AAA accessibility constraints...'}
                    {generationStage === 'DONE' && 'Done! Documentation integrated successfully.'}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="inline-block w-2 h-2 rounded-full bg-accent-pink animate-ping" />
                    Active Pipeline
                  </span>
                </div>
              </div>
            )}

            {generationError && (
              <div className="mt-6 flex items-start gap-3 rounded border border-error-red/40 bg-error-red/10 p-4 text-left text-xs text-error-red">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{generationError}</span>
              </div>
            )}

            {/* GENERATE PRIMARY BUTTON TRIGGER */}
            <div className="mt-8 flex justify-center">
              <button
                disabled={generationStage !== 'IDLE' || isLoading}
                onClick={handleGenerate}
                className={`flex h-12 w-full max-w-sm items-center justify-center rounded-md text-sm font-semibold tracking-wide transition-all shadow-md cursor-pointer ${generationStage !== 'IDLE' ? 'bg-surf-3 text-text-3 border border-border-match cursor-not-allowed' : 'bg-accent-pink text-black hover:bg-accent-pink/90 active:scale-95 duration-150'}`}
              >
                <span>Generate DESIGN.md System</span>
                <Sparkles size={16} className="ml-2 animate-pulse" />
              </button>
            </div>

          </div>

          {/* Footer stats bar */}
          <div className="bg-surf-2 border-t border-border-match px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-mono text-text-3 text-center sm:text-left">
            <span className="flex items-center gap-1.5 text-success-green">
              <span>●</span>
              <span>Regional Claude API Live Engine Connected</span>
            </span>
            <span>v1.2 Standardizer</span>
          </div>

        </div>

      </div>
    </section>
  );
}

async function streamDesignMd(
  request: GenerateRequest,
  onChunk: (raw: string, tokens: DesignTokens | null) => void
): Promise<{ raw: string; tokens: DesignTokens | null }> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Generation failed with HTTP ${response.status}.`);
  }

  if (!response.body) {
    throw new Error('The server did not return a readable stream.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let payload = '';
  let tokens: DesignTokens | null = null;
  let raw = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    payload += decoder.decode(value, { stream: true });
    const parsed = parseStreamPayload(payload, tokens);
    tokens = parsed.tokens;
    raw = parsed.raw;
    onChunk(raw, tokens);
  }

  payload += decoder.decode();
  const parsed = parseStreamPayload(payload, tokens);
  tokens = parsed.tokens;
  raw = parsed.raw;

  if (raw.startsWith('Generation failed:')) {
    throw new Error(raw.replace(/^Generation failed:\s*/, ''));
  }

  return { raw, tokens };
}

function parseStreamPayload(payload: string, existingTokens: DesignTokens | null): { raw: string; tokens: DesignTokens | null } {
  const match = payload.match(/^<!--DESIGNMD_TOKENS:([\s\S]*?)-->\n?/);
  if (!match) {
    return { raw: payload, tokens: existingTokens };
  }

  const tokens = existingTokens ?? parseTokenEnvelope(match[1]);
  return {
    raw: payload.slice(match[0].length),
    tokens,
  };
}

function parseTokenEnvelope(encoded: string): DesignTokens | null {
  try {
    return JSON.parse(decodeURIComponent(encoded)) as DesignTokens;
  } catch {
    return null;
  }
}

function buildGeneratedDocument(raw: string, preset: SamplePreset, tokens: DesignTokens | null): GeneratedDocument {
  const parsed = parseDesignMarkdown(raw);
  const tokenDocument = tokens ? buildDocumentFromTokens(tokens, raw, parsed.fontFamily) : null;

  return {
    ...preset.doc,
    title: parsed.title ?? preset.doc.title,
    createdAt: new Date().toISOString().slice(0, 10),
    markdown: raw,
    overview: parsed.overview ?? preset.doc.overview,
    colors: tokenDocument?.colors.length ? tokenDocument.colors : parsed.colors.length > 0 ? parsed.colors : preset.doc.colors,
    typography: tokenDocument?.typography.length ? tokenDocument.typography : parsed.typography.length > 0 ? parsed.typography : preset.doc.typography,
    spacing: tokenDocument?.spacing.length ? tokenDocument.spacing : parsed.spacing.length > 0 ? parsed.spacing : preset.doc.spacing,
    components: tokenDocument?.components.length ? tokenDocument.components : parsed.components.length > 0 ? parsed.components : preset.doc.components,
  };
}

function buildDocumentFromTokens(tokens: DesignTokens, raw: string, documentFontFamily: string | null): Pick<GeneratedDocument, 'colors' | 'typography' | 'spacing' | 'components'> {
  const markdownComponents = extractComponents(raw);
  const tokenComponents = tokens.components.map((component) => {
    const matchingSnippet = markdownComponents.find((item) => componentNamesMatch(item.name, component.name));

    return {
      name: component.name,
      description: component.notes ?? 'Component extracted from normalized design tokens.',
      variants: component.variants.map((variant) => ({
        name: variant.name,
        details: variant.description ?? (variant.states.join(', ') || 'Variant extracted from source analysis.'),
      })),
      tokensUsed: matchingSnippet?.tokensUsed ?? [],
      codeSnippet: matchingSnippet?.codeSnippet ?? '',
    };
  });
  const snippetOnlyComponents = markdownComponents.filter((markdownComponent) => (
    !tokenComponents.some((tokenComponent) => componentNamesMatch(tokenComponent.name, markdownComponent.name))
  ));

  return {
    colors: tokens.colors
      .filter((color) => color.hex && color.role !== 'unknown')
      .map((color) => ({
        name: String(color.role),
        hex: color.hex ?? '#000000',
        useCase: describeColorUse(String(color.role)),
      })),
    typography: normalizeTypographyRows(tokens.typography
      .filter((type) => type.role !== 'unknown')
      .map((type) => ({
        role: type.role,
        font: normalizeFontFamily(type.fontFamily, documentFontFamily),
        size: type.fontSize ?? 'N/A',
        weight: type.fontWeight === null ? 'N/A' : String(type.fontWeight),
        lineHeight: type.lineHeight ?? 'N/A',
        spacing: type.letterSpacing ?? undefined,
      }))),
    spacing: tokens.spacing.tokens.map((space) => ({
      token: space.name,
      px: space.value ?? (space.px === null ? 'N/A' : `${space.px}px`),
      context: `Spacing token from ${tokens.spacing.baseUnit ?? 'detected'}px base rhythm`,
    })),
    components: [...tokenComponents, ...snippetOnlyComponents].slice(0, 12),
  };
}

function parseDesignMarkdown(raw: string): {
  title: string | null;
  overview: string | null;
  fontFamily: string | null;
  colors: GeneratedDocument['colors'];
  typography: GeneratedDocument['typography'];
  spacing: GeneratedDocument['spacing'];
  components: GeneratedDocument['components'];
} {
  return {
    title: extractTitle(raw),
    overview: extractOverview(raw),
    fontFamily: extractFrontMatterValue(raw, 'fontFamily') ?? extractFrontMatterValue(raw, 'fontDecision'),
    colors: extractColors(raw),
    typography: extractTypography(raw),
    spacing: extractSpacing(raw),
    components: extractComponents(raw),
  };
}

function extractTitle(raw: string): string | null {
  return raw.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? raw.match(/^title:\s*"?([^"\n]+)"?/m)?.[1]?.trim() ?? null;
}

function extractFrontMatterValue(raw: string, key: string): string | null {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return raw.match(new RegExp(`^${escapedKey}:\\s*\"?([^\"\\n]+)\"?`, 'm'))?.[1]?.trim() ?? null;
}

function extractOverview(raw: string): string | null {
  const paragraph = raw
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 80 && !line.startsWith('#') && !line.startsWith('|') && !line.startsWith('-'));

  return paragraph ?? null;
}

function extractColors(raw: string): GeneratedDocument['colors'] {
  const section = extractSection(raw, /colors?|palette|swatches?|tokens?/i) ?? raw;
  const seen = new Set<string>();
  const colors: GeneratedDocument['colors'] = [];

  section.split('\n').forEach((line, index, lines) => {
    const matches = line.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
    matches.forEach((match) => {
      const hex = normalizeHex(match);
      if (!hex || seen.has(hex)) return;
      seen.add(hex);

      colors.push({
        name: extractTokenName(line) ?? `color-${colors.length + 1}`,
        hex,
        useCase: stripMarkdown(line.replace(match, '')).replace(/^[-*:|,\s]+/, '') || stripMarkdown(lines[index + 1] ?? '') || 'Extracted from generated DESIGN.md',
      });
    });
  });

  return colors.slice(0, 32);
}

function extractTypography(raw: string): GeneratedDocument['typography'] {
  const section = extractSection(raw, /typography|type scale|font/i) ?? '';
  const rows: GeneratedDocument['typography'] = [];

  section.split('\n').forEach((line) => {
    const size = line.match(/\b\d+(\.\d+)?(px|rem|em)\b/i)?.[0];
    const family = line.match(/font(?:-family)?\s*[:=]\s*`?([^`,|;)]+)/i)?.[1]?.trim()
      ?? line.match(/\b(Inter|Geist|Arial|Helvetica|Roboto|SF Pro|Manrope|DM Sans|Avenir|Satoshi|system-ui|sans-serif|serif|monospace)\b/i)?.[0]
      ?? 'Not specified';
    const role = extractTokenName(line) ?? line.match(/\b(h[1-6]|body|label|caption|overline|display|heading)\b/i)?.[0] ?? `Type ${rows.length + 1}`;
    const weight = line.match(/\b(?:weight|font-weight)\s*[:=]?\s*`?(\d{3}|normal|regular|medium|semibold|bold)\b/i)?.[1] ?? 'N/A';
    const lineHeight = line.match(/line-height\s*[:=]\s*`?([^`,|;)]+)/i)?.[1]?.trim()
      ?? line.match(/\b\d+(\.\d+)?\s*(?:line-height|lh)\b/i)?.[0]
      ?? 'N/A';

    if (size) {
      rows.push({ role: stripMarkdown(role), font: stripMarkdown(family), size, weight, lineHeight });
    }
  });

  return dedupeRows(rows, (row) => `${row.role}:${row.size}`).slice(0, 20);
}

function extractSpacing(raw: string): GeneratedDocument['spacing'] {
  const section = extractSection(raw, /spacing|layout|grid|rhythm/i) ?? '';
  const rows: GeneratedDocument['spacing'] = [];

  section.split('\n').forEach((line) => {
    const value = line.match(/\b\d+(\.\d+)?(px|rem|em)\b/i)?.[0];
    if (!value) return;

    rows.push({
      token: stripMarkdown(extractTokenName(line) ?? `space-${rows.length + 1}`),
      px: value,
      context: stripMarkdown(line).slice(0, 160) || 'Extracted spacing token',
    });
  });

  return dedupeRows(rows, (row) => `${row.token}:${row.px}`).slice(0, 24);
}

function extractComponents(raw: string): GeneratedDocument['components'] {
  const componentSection = extractSection(raw, /components?|blueprints?|patterns?|inventory/i) ?? raw;
  const codeFences = [...raw.matchAll(/```(\w+)?\n([\s\S]*?)```/g)];
  const components: GeneratedDocument['components'] = [];

  codeFences.forEach((match, index) => {
    const language = (match[1] ?? '').toLowerCase();
    if (language === 'yaml' || language === 'json') return;

    const snippet = match[2].trim();
    if (!snippet) return;

    const beforeSnippet = raw.slice(0, match.index ?? 0);
    const heading = findComponentHeading(beforeSnippet) ?? inferSnippetName(snippet, index);

    components.push({
      name: stripMarkdown(heading),
      description: extractNearestDescription(componentSection, heading) ?? 'Generated implementation snippet extracted from DESIGN.md.',
      variants: extractVariants(componentSection, heading),
      tokensUsed: extractTokensUsed(snippet),
      codeSnippet: snippet,
    });
  });

  if (components.length > 0) {
    return dedupeRows(components, (component) => `${component.name}:${component.codeSnippet}`).slice(0, 12);
  }

  return extractComponentBullets(componentSection);
}

function findComponentHeading(markdownBeforeSnippet: string): string | null {
  const canonical = ['button', 'navigation', 'accordion', 'tabs', 'tab', 'modal', 'card', 'badge', 'input', 'form'];
  const headings = [...markdownBeforeSnippet.matchAll(/^#{2,4}\s+(.+)$/gm)].map((match) => stripMarkdown(match[1]));
  const canonicalHeading = [...headings].reverse().find((heading) => canonical.includes(heading.toLowerCase()));

  return canonicalHeading ?? headings.at(-1) ?? null;
}

function extractComponentBullets(section: string): GeneratedDocument['components'] {
  return section
    .split('\n')
    .filter((line) => /^[-*]\s+/.test(line.trim()))
    .slice(0, 12)
    .map((line, index) => {
      const name = extractTokenName(line) ?? `Component ${index + 1}`;

      return {
        name: stripMarkdown(name),
        description: stripMarkdown(line).slice(0, 180),
        variants: [],
        tokensUsed: extractTokensUsed(line),
        codeSnippet: `// ${stripMarkdown(line)}`,
      };
    });
}

function extractSection(raw: string, headingPattern: RegExp): string | null {
  const sections = [...raw.matchAll(/^#{2,4}\s+(.+?)\s*$/gm)];
  const heading = sections.find((match) => headingPattern.test(match[1]));
  if (!heading || heading.index === undefined) return null;

  const nextHeading = sections.find((match) => (match.index ?? 0) > (heading.index ?? 0) && /^#{2,4}/.test(match[0]));
  return raw.slice(heading.index, nextHeading?.index ?? raw.length);
}

function extractTokenName(line: string): string | null {
  return line.match(/\*\*([^*]+)\*\*/)?.[1]?.trim()
    ?? line.match(/`([^`]+)`/)?.[1]?.trim()
    ?? line.match(/^[-*]\s*([^:|-]+)[:|-]/)?.[1]?.trim()
    ?? line.match(/^\|?\s*([^|:]+)\s*[|:]/)?.[1]?.trim()
    ?? null;
}

function extractNearestDescription(section: string, heading?: string): string | null {
  if (!heading) return null;

  const start = section.indexOf(heading);
  const slice = start >= 0 ? section.slice(start + heading.length) : section;
  return slice
    .split('\n')
    .map((line) => stripMarkdown(line.trim()))
    .find((line) => line.length > 40 && !line.startsWith('```')) ?? null;
}

function extractVariants(section: string, heading?: string): GeneratedDocument['components'][number]['variants'] {
  if (!heading) return [];

  const start = section.indexOf(heading);
  const slice = start >= 0 ? section.slice(start, start + 1200) : section;
  return slice
    .split('\n')
    .filter((line) => /variant|state|default|hover|active|disabled|primary|secondary|ghost|outline/i.test(line))
    .slice(0, 6)
    .map((line, index) => ({
      name: extractTokenName(line) ?? `Variant ${index + 1}`,
      details: stripMarkdown(line).slice(0, 140),
    }));
}

function extractTokensUsed(text: string): string[] {
  const cssVars = [...text.matchAll(/--[a-z0-9-]+/gi)].map((match) => match[0]);
  const hexes = [...text.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((match) => normalizeHex(match[0])).filter((hex): hex is string => Boolean(hex));
  return dedupeRows([...cssVars, ...hexes], (token) => token).slice(0, 8);
}

function describeColorUse(role: string): string {
  if (role.includes('text')) return 'Text hierarchy and readable content states';
  if (role.includes('surface') || role.includes('background')) return 'Page, panel, and layered surface structure';
  if (role.includes('border')) return 'Dividers, outlines, and component boundaries';
  if (role.includes('primary') || role.includes('accent')) return 'Primary actions, focus states, and brand emphasis';
  if (role.includes('error')) return 'Destructive, invalid, or failure state messaging';
  if (role.includes('success')) return 'Positive confirmation and completed state messaging';
  if (role.includes('warning')) return 'Cautionary or attention-requiring UI states';
  return 'Extracted semantic color role from source analysis';
}

function normalizeFontFamily(tokenFont: string | null | undefined, documentFont: string | null): string {
  const normalized = tokenFont?.trim();

  if (!normalized || /^(not specified|unknown|n\/a)$/i.test(normalized)) {
    return documentFont ?? 'Not specified';
  }

  return normalized;
}

function normalizeTypographyRows(rows: GeneratedDocument['typography']): GeneratedDocument['typography'] {
  const rowsByRole = new Map<string, GeneratedDocument['typography'][number]>();

  rows.forEach((row) => {
    const existing = rowsByRole.get(row.role);
    rowsByRole.set(row.role, existing ? mergeTypographyRows(existing, row) : row);
  });

  return Array.from(rowsByRole.values());
}

function mergeTypographyRows(
  first: GeneratedDocument['typography'][number],
  second: GeneratedDocument['typography'][number],
): GeneratedDocument['typography'][number] {
  const preferred = scoreTypographyRow(second) > scoreTypographyRow(first) ? second : first;
  const fallback = preferred === first ? second : first;

  return {
    role: preferred.role,
    font: pickUsefulTypographyValue(preferred.font, fallback.font) ?? 'Not specified',
    size: pickUsefulTypographyValue(preferred.size, fallback.size) ?? 'N/A',
    weight: pickUsefulTypographyValue(preferred.weight, fallback.weight) ?? 'N/A',
    lineHeight: pickUsefulTypographyValue(preferred.lineHeight, fallback.lineHeight) ?? 'N/A',
    spacing: pickUsefulTypographyValue(preferred.spacing, fallback.spacing) ?? undefined,
  };
}

function scoreTypographyRow(row: GeneratedDocument['typography'][number]): number {
  return [row.font, row.size, row.weight, row.lineHeight, row.spacing]
    .filter((value) => isUsefulTypographyValue(value))
    .length;
}

function pickUsefulTypographyValue(primary?: string, fallback?: string): string | undefined {
  if (isUsefulTypographyValue(primary)) return primary;
  if (isUsefulTypographyValue(fallback)) return fallback;
  return undefined;
}

function isUsefulTypographyValue(value?: string): value is string {
  return Boolean(value && !/^(not specified|unknown|n\/a|null)$/i.test(value.trim()));
}

function componentNamesMatch(first: string, second: string): boolean {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return normalize(first).includes(normalize(second)) || normalize(second).includes(normalize(first));
}

function inferSnippetName(snippet: string, index: number): string {
  if (snippet.includes('<button') || snippet.includes('Button')) return 'Button';
  if (snippet.includes('<input') || snippet.includes('Input')) return 'Input';
  if (snippet.includes('<nav') || snippet.includes('Navigation')) return 'Navigation';
  if (snippet.includes('card') || snippet.includes('Card')) return 'Card';
  if (snippet.includes(':root')) return 'CSS Variable Export';
  if (snippet.includes('tailwind')) return 'Tailwind Config Export';
  return `Snippet ${index + 1}`;
}

function normalizeHex(hex: string): string | null {
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  if (/^#[0-9a-f]{6}$/i.test(hex)) return hex.toUpperCase();
  if (/^#[0-9a-f]{8}$/i.test(hex)) return hex.slice(0, 7).toUpperCase();
  return null;
}

function stripMarkdown(value: string): string {
  return value
    .replace(/[`*_>#|]/g, '')
    .replace(/^-+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeRows<TItem>(items: TItem[], getKey: (item: TItem) => string): TItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(new Error('Could not read the uploaded image.'));
    reader.readAsDataURL(file);
  });
}
