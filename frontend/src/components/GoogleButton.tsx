import { useEffect, useRef, type ReactNode } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleButtonProps {
  onCredential: (credential: string) => void;
  text?: "signin_with" | "continue_with";
  theme?: "outline" | "filled_blue" | "filled_black";
  width?: number;
  // Quando passado, renderiza um botão custom visível e sobrepõe o botão
  // oficial do Google (transparente) por cima, capturando o clique. Assim dá
  // pra estilizar livremente sem abrir mão do fluxo seguro de credential do GIS.
  children?: ReactNode;
}

export function GoogleButton({
  onCredential,
  text = "signin_with",
  theme = "outline",
  width = 316,
  children,
}: GoogleButtonProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    let attempts = 0;

    // o script GIS carrega async; tenta até ~5s antes de desistir
    const tryRender = () => {
      if (cancelled || !divRef.current) return;
      const id = window.google?.accounts?.id;
      if (!id) {
        if (attempts++ < 50) setTimeout(tryRender, 100);
        return;
      }
      id.initialize({
        client_id: CLIENT_ID,
        callback: (res) => callbackRef.current(res.credential),
      });
      id.renderButton(divRef.current, {
        theme,
        size: "large",
        shape: "rectangular",
        text,
        locale: "pt_BR",
        width,
      });
    };
    tryRender();
    return () => {
      cancelled = true;
    };
  }, [text, theme, width]);

  if (!CLIENT_ID) return null;

  // modo overlay: visual custom por baixo, botão real do Google transparente em cima
  if (children) {
    return (
      <div style={{ position: "relative", width: "100%" }}>
        {children}
        <div
          ref={divRef}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      </div>
    );
  }

  return <div ref={divRef} />;
}
