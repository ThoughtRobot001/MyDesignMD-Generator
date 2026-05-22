import { SamplePreset } from './types';

export const SYSTEM_FEATURES = [
  {
    id: 'extract-colors',
    title: 'Extract Colors Automatically',
    description: 'Identifies primary, neutral surface ladders, utility states, and custom semantic variations instantly.',
    icon: 'Palette',
    badge: 'Dual Extraction'
  },
  {
    id: 'typography-detection',
    title: 'Typography Scale Detection',
    description: 'Extracts display, heading hierarchies, UI labels, body spacing heights, and exact letter spacing mappings.',
    icon: 'Type',
    badge: 'Scale Extraction'
  },
  {
    id: 'spacing-analysis',
    title: 'Spacing & Layout Analysis',
    description: 'Decodes baseline 4px or 8px grid alignments, gap patterns, padding, and section margins automatically.',
    icon: 'Ruler',
    badge: 'Layout Math'
  },
  {
    id: 'component-inventory',
    title: 'Component Inventory Spec',
    description: 'Creates exhaustive blueprints of buttons, input styles, chips, and interactive charts with variant mappings.',
    icon: 'Box',
    badge: 'Code Generator'
  },
  {
    id: 'accessibility-insights',
    title: 'Accessibility Insights',
    description: 'Flags contrast discrepancies on dark interfaces and computes exact compliance metrics (AA/AAA).',
    icon: 'Eye',
    badge: 'AA / AAA Specs'
  },
  {
    id: 'extract-markdown',
    title: 'Export to Markdown',
    description: 'Generates standardized, beautiful markdown files that integrate directly with standard repository documentation.',
    icon: 'FileText',
    badge: 'v1.4 Spec'
  },
  {
    id: 'ai-recommendations',
    title: 'AI-Powered Recommendations',
    description: 'Advises on system-wide token consolidation, removing near-redundant shades, values, and styles.',
    icon: 'Sparkles',
    badge: 'Smart Token Clean'
  },
  {
    id: 'token-generation',
    title: 'Design Token CSS Variable Exports',
    description: 'Auto-outputs raw JSON, Tailwind configurations, CSS variables, and styled Tailwind classes for immediate insert.',
    icon: 'Coins',
    badge: 'Multi-format'
  }
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Upload Design Source',
    desc: 'Drag and drop an app screenshot, paste a live workspace URL, or sync a Figma component tree.',
    icon: 'UploadCloud'
  },
  {
    step: '02',
    title: 'AI Decodes Semantics',
    desc: 'The pipeline extracts visual metadata, builds a nested component hierachy, and checks contrast alignment.',
    icon: 'Binary'
  },
  {
    step: '03',
    title: 'Instant DESIGN.md Output',
    desc: 'Review, test variants interactive, copy CSS tokens, and download pristine design system documentation.',
    icon: 'FileCode'
  }
];

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'preset-linear-dark',
    tabType: 'SCREENSHOT',
    title: 'Cronos Dashboard UI',
    inputValue: 'dashboard_screenshot_cronos_v4.png',
    description: 'Analytical Dark Dashboard featuring intense data density, custom line-charts, and close-value neutral surface ladders.',
    promptHint: 'Extracting a 5-tier neutral background stack, muted cyan accents, and a robust typography grid from screenshot metadata.',
    doc: {
      title: 'Cronos Dashboard System',
      createdAt: '2026-05-20',
      confidence: 0.94,
      overview: 'This design system is extracted from the high-frequency Cronos analytical tool stack. It features a restrained cyan accent model atop a dense, five-level dark structural background stack. Layout alignment prioritizes data widgets and sparklines without heavy shadows.',
      colors: [
        { name: 'background', hex: '#000000', useCase: 'Deepest page foundation, app container margins' },
        { name: 'surface', hex: '#0A0A0A', useCase: 'Primary card/chart widgets stage backdrop' },
        { name: 'surface2', hex: '#111111', useCase: 'Input backgrounds, inactive list headers' },
        { name: 'surface3', hex: '#1A1A1A', useCase: 'Interactive hover elements, control trays' },
        { name: 'accent', hex: '#A7D7D2', useCase: 'Primary high-priority CTAs, focus indicators, active values' },
        { name: 'border', hex: '#2E2E2E', useCase: 'Default clean boundary divider line' },
        { name: 'border2', hex: '#454545', useCase: 'Active focus or key element isolation borders' },
        { name: 'success', hex: '#3DD68C', useCase: 'Active uptrend status dots, completion state indicators' }
      ],
      typography: [
        { role: 'Display (H1)', font: 'GeistPixel-Line', size: '48px', weight: '400', lineHeight: '1' },
        { role: 'Heading 2 (H2)', font: 'GeistPixel-Square', size: '40px', weight: '600', lineHeight: '1.1' },
        { role: 'Body Normal', font: 'Geist', size: '14px', weight: '400', lineHeight: '1.5' },
        { role: 'Caption Mono', font: 'Geist Mono', size: '12px', weight: '500', lineHeight: '1.4' }
      ],
      spacing: [
        { token: 'xs', px: '4px', context: 'Micro indicators and inline icons gap' },
        { token: 'md', px: '12px', context: 'Standard button padding, small container lists' },
        { token: 'xl', px: '24px', context: 'Interior padding of high-level metric modules' },
        { token: '2xl', px: '32px', context: 'Macro spacing separating analytical graphs' }
      ],
      components: [
        {
          name: 'Primary Precision Button',
          description: 'A highly distinct visual control crafted to grab immediate cursor interaction on the deep dark stage.',
          variants: [
            { name: 'Default', details: 'Accent color solid backdrop with background text color' },
            { name: 'Hover', details: 'Add border highlight (#454545) with slight scale response' }
          ],
          tokensUsed: ['accent', 'background', 'surface3'],
          codeSnippet: `<button className="px-3.5 py-1.5 bg-[#A7D7D2] hover:bg-[#A7D7D2]/90 text-black font-semibold text-sm rounded-md transition-all border border-transparent hover:border-[#454545] active:scale-95 duration-150">
  Execute Action
</button>`
        },
        {
          name: 'Precision Sparkline Wrapper',
          description: 'Compact analytical plotting overlay with micro indicators and custom data curves.',
          variants: [
            { name: 'State Positive', details: '#3DD68C trend indicators' },
            { name: 'State Inactive', details: '#878787 neutral coordinate line' }
          ],
          tokensUsed: ['surface', 'border', 'success'],
          codeSnippet: `<div className="p-4 bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg">
  <div className="flex justify-between items-center mb-2">
    <span className="text-[12px] font-mono text-[#878787]">REALTIME_PING</span>
    <span className="text-xs text-[#3DD68C] font-mono">● 200 ms</span>
  </div>
  <div className="h-10 w-full bg-[#111111] rounded-sm relative overflow-hidden">
    {/* Real sparkline drawing surface */}
  </div>
</div>`
        }
      ],
      markdown: `# Design System: Cronos Dashboard

## Overview
This design system is extracted from the high-frequency Cronos analytical tool stack. It features a soft cyan accent (#A7D7D2) atop a dense, five-level dark background stack sequence.

## Colors
- **background**: \`#000000\` - Deepest page foundation
- **surface**: \`#0A0A0A\` - Primary card backdrops
- **surface2**: \`#111111\` - Controls, input trays
- **accent**: \`#A7D7D2\` - Primary CTA buttons, focus bars
- **border**: \`#2E2E2E\` - Boundary divider line
- **success**: \`#3DD68C\` - Active statistics metrics

## Typography scales
- **H1 (Display)**: VT323 (GeistPixel style), 48px, line-height 1
- **H2 (Section)**: VT323, 40px, bold
- **Body UI**: Geist, 14px, regular
- **System Mono**: Geist Mono, 12px

## Components Mapping

### Primary Precision Button
\`\`\`html
<button className="px-3.5 py-1.5 bg-[#A7D7D2] text-black rounded-md">
  Execute Action
</button>
\`\`\`
`
    }
  },
  {
    id: 'preset-figma-buttons',
    tabType: 'FIGMA',
    title: 'Linear Button Variant Spec',
    inputValue: 'https://figma.com/file/linear-v3-components-ui-kit',
    description: 'Component spec with nested frames, detailed corner settings, letter-spacing specs, and fully parsed icon constraints.',
    promptHint: 'Decoding layout variables, nested layout margins, ghost/primary styling matrices, and custom 6px/8px shapes.',
    doc: {
      title: 'Linear Components Kit',
      createdAt: '2026-05-18',
      confidence: 0.98,
      overview: 'Figma metadata parsed perfectly. This spec documents primary action sets, boundary settings, and text-to-icon alignments. Radii constraints are bound to responsive sizes.',
      colors: [
        { name: 'background', hex: '#000000', useCase: 'Global foundation' },
        { name: 'surface', hex: '#0D0D0D', useCase: 'Standard component frame containment' },
        { name: 'accent', hex: '#A7D7D2', useCase: 'Active button fill and interactive markers' },
        { name: 'border', hex: '#2E2E2E', useCase: 'Quiet boundary line' },
        { name: 'secondary-text', hex: '#A0A0A0', useCase: 'Icon colors and supportive label labels' }
      ],
      typography: [
        { role: 'Primary Metric', font: 'GeistPixel-Line', size: '32px', weight: '400', lineHeight: '1.2' },
        { role: 'Standard UI Label', font: 'Geist', size: '14px', weight: '500', lineHeight: '1.4' },
        { role: 'Micro Tag text', font: 'Geist Mono', size: '11px', weight: '600', lineHeight: '1.3' }
      ],
      spacing: [
        { token: 'sm', px: '8px', context: 'Interior spacing of badge blocks' },
        { token: 'md', px: '12px', context: 'Vertical buttons padding' },
        { token: 'lg', px: '16px', context: 'Group alignment gap spacing' }
      ],
      components: [
        {
          name: 'Custom Action Variant Pill',
          description: 'A fully rounded layout capsule suitable for tag actions, filter chips, or micro-nav selectors.',
          variants: [
            { name: 'Variant Active', details: 'Full accent backdrop (#A7D7D2) with deep background text color' },
            { name: 'Variant Passive', details: 'Neutral surface background (#1A1A1A) with border frame' }
          ],
          tokensUsed: ['accent', 'surface', 'border'],
          codeSnippet: `<div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2E2E2E] rounded-full text-xs font-mono text-white cursor-pointer transition-colors">
  <span>tag_name</span>
  <span className="text-[10px] text-[#A0A0A0]">24</span>
</div>`
        }
      ],
      markdown: `# Figma Spec: Linear Action System

## Typography & Dimensions
- Radius is bound to exactly 6px for UI interfaces.
- Inter-layout gaps default to 8px.

## Micro-Tokens
- **Active Accents**: \`#A7D7D2\`
- **Surface Level**: \`#0D0D0D\`
`
    }
  },
  {
    id: 'preset-stripe-invoice',
    tabType: 'URL',
    title: 'Stripe Billing Frame',
    inputValue: 'https://stripe.com/docs/billing/components/portal',
    description: 'Extracted semantic parameters from Stripe Live Client DOM. Highlighted features include clear layout grids and perfect accessible contrast levels.',
    promptHint: 'Checking live DOM trees, fetching deep CSS structures, examining accessible AAA text ratings.',
    doc: {
      title: 'Stripe Portal Guide',
      createdAt: '2026-05-15',
      confidence: 0.89,
      overview: 'Live DOM extraction complete. All 18 buttons and color swatches map cleanly. Spanning layouts use a strict 12px layout grid with consistent border definitions.',
      colors: [
        { name: 'background', hex: '#000000', useCase: 'Deep container margins' },
        { name: 'surface', hex: '#0A0A0A', useCase: 'Secondary dashboard cards' },
        { name: 'accent', hex: '#A7D7D2', useCase: 'Clickable links and highlighted totals' },
        { name: 'success', hex: '#3DD68C', useCase: 'Paid invoice badges and active tags' },
        { name: 'error-alt', hex: '#F87171', useCase: 'Failed transaction alerts' }
      ],
      typography: [
        { role: 'Section Headline', font: 'GeistPixel-Square', size: '24px', weight: '600', lineHeight: '1.2' },
        { role: 'Readable Body', font: 'Geist', size: '15px', weight: '400', lineHeight: '1.6' },
        { role: 'Invoiced Metric', font: 'Geist Mono', size: '14px', weight: '500', lineHeight: '1.5' }
      ],
      spacing: [
        { token: 'sm', px: '8px', context: 'Gaps between items' },
        { token: 'lg', px: '16px', context: 'Standard structural padding' },
        { token: 'xl', px: '24px', context: 'Main section margin spacing' }
      ],
      components: [
        {
          name: 'Paid Invoice State Card',
          description: 'A data card designed to convey balance information safely, compliant with AAA visual guidelines.',
          variants: [
            { name: 'Success State', details: 'Shows success badge with green text element' }
          ],
          tokensUsed: ['surface', 'success', 'border'],
          codeSnippet: `<div className="flex justify-between items-center p-4 bg-[#0A0A0A] border border-[#2E2E2E] rounded-md">
  <div>
    <h4 className="text-sm font-medium text-white">Invoice #019A</h4>
    <p className="text-xs text-[#A0A0A0]">Processed on May 20, 2026</p>
  </div>
  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#3DD68C]/10 border border-[#3DD68C]/20 rounded-full text-xs font-mono text-[#3DD68C]">
    <span>●</span>
    <span>Paid</span>
  </div>
</div>`
        }
      ],
      markdown: `# Stripe Component System Output

## Metrics & Layout
- Grid layout: 12-column flexbox rules.
- Margin: 24px standard gutter margins.
`
    }
  }
];
