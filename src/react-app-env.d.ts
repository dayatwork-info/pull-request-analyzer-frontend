/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PUBLIC_URL: string;
    REACT_APP_AUTH_API_URL: string;
    REACT_APP_GITHUB_API_URL: string;
    REACT_APP_JOURNAL_API_URL: string;
    REACT_APP_WORK_JOURNAL_URL: string;
    REACT_APP_DEBUG_MODE: string;
  }
}
