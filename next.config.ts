import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garante que o pacote server-only não vaze para o bundle do cliente.
  serverExternalPackages: [],

  // Cabeçalhos de segurança mínimos para produção.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
