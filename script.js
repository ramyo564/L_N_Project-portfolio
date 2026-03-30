import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
import { templateConfig } from './config.js';
import { initializeMermaid } from './js/shared/mermaid.js';
import { bootstrapHomePage } from './js/pages/home/bootstrap.js';

initializeMermaid(mermaid, templateConfig.mermaid);
bootstrapHomePage({ templateConfig, mermaid });
