import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Alias jest → vi para compatibilidad con tests escritos en estilo Jest
(globalThis as any).jest = vi;
