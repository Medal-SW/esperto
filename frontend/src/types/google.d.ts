// Tipos mínimos do Google Identity Services (script https://accounts.google.com/gsi/client)

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleButtonOptions {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  shape?: "rectangular" | "pill" | "circle" | "square";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  locale?: string;
  width?: number;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize(config: {
          client_id: string;
          callback: (response: GoogleCredentialResponse) => void;
        }): void;
        renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
      };
    };
  };
}
