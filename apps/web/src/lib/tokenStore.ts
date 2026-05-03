// In-memory only - not localStorage to mitigate XSS
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (t: string) => {
    accessToken = t;
  },
  clear: () => {
    accessToken = null;
  },
};
