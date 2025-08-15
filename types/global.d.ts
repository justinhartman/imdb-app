declare global {
  /**
   * Represents a user object for verification purposes.
   * Used primarily in authentication and password validation contexts.
   */
  type VerifyUser = {
    id: string;
    matchPassword: (plain: string) => Promise<boolean>;
  };
}

export {};
