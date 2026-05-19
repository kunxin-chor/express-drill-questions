#!/usr/bin/env node
/**
 * Walks questions/ recursively, parses each Markdown question file, and
 * emits questions.generated.json at the project root.
 *
 * Authoring contract: see ../requirements.md
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const QUESTIONS_DIR = path.join(ROOT, 'questions');
const OUTPUT = path.join(ROOT, 'questions.generated.json');

const REQUIRED_SECTIONS = ['Problem', 'Starter', 'Tests'];
const KNOWN_SECTIONS = new Set([
  'Problem',
  'Starter',
  'Solution',
  'Tests',
  'Walkthrough',
]);
const CODE_SECTIONS = new Set(['Starter', 'Solution', 'Tests']);

/* --------------------------------- utils -------------------------------- */

function stripOrderPrefix(name) {
  // "01-hello-world" -> { order: 1, slug: "hello-world" }
  const m = /^(\d+)[-_](.+)$/.exec(name);
  if (m) return { order: parseInt(m[1], 10), slug: m[2] };
  return { order: 0, slug: name };
}

function slugToTitle(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function listMdFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.md'))
    .map((d) => d.name)
    .sort();
}

function listSubdirs(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/* ------------------------------ MD parsing ------------------------------ */

/**
 * Split a Markdown document by top-level (H1) section headings.
 * Returns { [sectionName]: rawMarkdown } including the leading prelude
 * under key "_prelude" (usually empty).
 *
 * Code fences are tracked so a `#` inside a fenced block is NOT treated as
 * a heading.
 */
function splitH1Sections(md) {
  const lines = md.split(/\r?\n/);
  const sections = {};
  let current = '_prelude';
  let buffer = [];
  let inFence = false;
  let fenceMarker = '';

  const flush = () => {
    const text = buffer.join('\n').replace(/^\s+|\s+$/g, '');
    if (sections[current] !== undefined) {
      throw new Error(`duplicate section heading "${current}"`);
    }
    sections[current] = text;
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trimStart();
    // Track fenced blocks (``` or ~~~), minimum 3 chars.
    const fenceMatch = /^(`{3,}|~{3,})/.exec(trimmed);
    if (fenceMatch) {
      const marker = fenceMatch[1][0].repeat(3); // normalize to length-3 marker
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (trimmed.startsWith(fenceMarker)) {
        inFence = false;
        fenceMarker = '';
      }
    }

    if (!inFence) {
      const h1 = /^#\s+(.+?)\s*$/.exec(line);
      if (h1) {
        flush();
        current = h1[1].trim();
        continue;
      }
    }
    buffer.push(line);
  }
  flush();
  return sections;
}

/**
 * Extract the contents of a single fenced ```js (or javascript) block from
 * a section's markdown. Returns the raw code string.
 */
function extractSingleCodeBlock(sectionName, md) {
  const re = /```(?:js|javascript)\s*\n([\s\S]*?)\n```/g;
  const matches = [];
  let m;
  while ((m = re.exec(md)) !== null) matches.push(m[1]);
  if (matches.length === 0) {
    throw new Error(
      `section "${sectionName}" must contain one \`\`\`js code block`,
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `section "${sectionName}" must contain exactly one \`\`\`js block, found ${matches.length}`,
    );
  }
  return matches[0];
}

/* --------------------------- question loading --------------------------- */

function parseQuestionFile(absPath, categorySlug) {
  const baseName = path.basename(absPath, '.md');
  if (baseName.startsWith('_')) return null; // _category.md, etc.

  const { order, slug } = stripOrderPrefix(baseName);
  const id = slug;
  const title = slugToTitle(slug);

  const raw = fs.readFileSync(absPath, 'utf8');
  let sections;
  try {
    sections = splitH1Sections(raw);
  } catch (err) {
    throw new Error(`${absPath}: ${err.message}`);
  }

  // Validate section names.
  for (const name of Object.keys(sections)) {
    if (name === '_prelude') continue;
    if (!KNOWN_SECTIONS.has(name)) {
      throw new Error(
        `${absPath}: unknown section "# ${name}". Allowed: ${[...KNOWN_SECTIONS].join(', ')}`,
      );
    }
  }
  for (const required of REQUIRED_SECTIONS) {
    if (!(required in sections)) {
      throw new Error(`${absPath}: missing required section "# ${required}"`);
    }
  }

  const question = {
    id,
    categorySlug,
    title,
    order,
    prompt: sections.Problem,
    starter: extractSingleCodeBlock('Starter', sections.Starter),
    testCode: extractSingleCodeBlock('Tests', sections.Tests),
    solution: sections.Solution
      ? extractSingleCodeBlock('Solution', sections.Solution)
      : '',
    walkthrough: sections.Walkthrough || '',
  };
  return question;
}

function parseCategoryIntro(dir) {
  const introFile = path.join(dir, '_category.md');
  if (!fs.existsSync(introFile)) return { title: null, intro: '' };
  const raw = fs.readFileSync(introFile, 'utf8');
  // First H1 (if any) becomes the title; rest is intro.
  const m = /^#\s+(.+?)\s*$/m.exec(raw);
  if (m) {
    const title = m[1].trim();
    const intro = raw.slice(m.index + m[0].length).trim();
    return { title, intro };
  }
  return { title: null, intro: raw.trim() };
}

function loadAll() {
  if (!fs.existsSync(QUESTIONS_DIR)) {
    return { categories: [] };
  }

  const categoryDirs = listSubdirs(QUESTIONS_DIR);
  const categories = [];

  for (const dirName of categoryDirs) {
    const dir = path.join(QUESTIONS_DIR, dirName);
    const { order: catOrder, slug: catSlug } = stripOrderPrefix(dirName);
    const { title: titleOverride, intro } = parseCategoryIntro(dir);
    const title = titleOverride || slugToTitle(catSlug);

    const questions = [];
    for (const file of listMdFiles(dir)) {
      if (file.startsWith('_')) continue;
      const q = parseQuestionFile(path.join(dir, file), catSlug);
      if (q) questions.push(q);
    }
    questions.sort(
      (a, b) => a.order - b.order || a.id.localeCompare(b.id),
    );

    categories.push({
      slug: catSlug,
      title,
      intro,
      order: catOrder,
      questions,
    });
  }
  categories.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
  return { categories };
}

/* ---------------------------------- run --------------------------------- */

function build() {
  const data = loadAll();
  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2) + '\n', 'utf8');
  const counts = data.categories.map(
    (c) => `${c.slug}(${c.questions.length})`,
  );
  console.log(
    `[build-questions] wrote ${path.relative(ROOT, OUTPUT)} — ${counts.join(', ') || 'no categories'}`,
  );
}

function watch() {
  build();
  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        build();
      } catch (err) {
        console.error('[build-questions] error:', err.message);
      }
    }, 150);
  };
  // Recursive watch is supported on Windows and macOS; on Linux it falls
  // back gracefully (a few editors won't trigger but saves still work).
  fs.watch(QUESTIONS_DIR, { recursive: true }, schedule);
  console.log('[build-questions] watching questions/ for changes…');
}

if (require.main === module) {
  try {
    if (process.argv.includes('--watch')) {
      watch();
    } else {
      build();
    }
  } catch (err) {
    console.error('[build-questions] failed:', err.message);
    process.exit(1);
  }
}

module.exports = { build, loadAll };
