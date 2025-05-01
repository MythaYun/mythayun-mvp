// For MSW v2.7.5, we need to use this import pattern
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);