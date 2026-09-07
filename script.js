/**
 * Main Application Orchestrator (Swiss Minimalist Edition)
 * - Single Responsibility Principle (SRP): Pure entrypoint orchestration
 * - Facade Pattern: Delegates full lifecycle to portfolio-engine
 */
import { portfolioConfig } from './portfolio.config.js';
import { initPortfolio } from './js/engine/portfolio-engine.js';

document.addEventListener('DOMContentLoaded', () => {
    initPortfolio(portfolioConfig);
});
