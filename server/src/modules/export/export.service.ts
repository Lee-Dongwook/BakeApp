import { Injectable, NotFoundException } from "@nestjs/common";
import JSZip from "jszip";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class ExportService {
  constructor(private readonly dbService: DatabaseService) {}

  private renderNodeToJsx(node: any): string {
    if (typeof node === "string") return node;
    if (!node) return "";

    const propsStr = Object.entries(node.props || {})
      .filter(([k]) => k !== "onClickWorkflow")
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");

    const styleObj = node.style || {};
    const styleStr = Object.keys(styleObj).length
      ? `style={${JSON.stringify(styleObj)}}`
      : "";

    const combinedProps = [propsStr, styleStr].filter(Boolean).join(" ");

    const childrenJsx = Array.isArray(node.children)
      ? node.children
          .map((child: any) => this.renderNodeToJsx(child))
          .join("\n")
      : "";

    switch (node.type) {
      case "Button":
        return `<button ${combinedProps} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">\n${childrenJsx}\n</button>`;
      case "TextInput":
        return `<input type="text" ${combinedProps} className="border border-gray-300 rounded px-3 py-2" />`;
      case "Container":
      case "View":
        return `<div ${combinedProps} className="p-4">\n${childrenJsx}\n</div>`;
      case "Text":
        return `<span ${combinedProps}>\n${childrenJsx}\n</span>`;
      default:
        return `<div ${combinedProps}>\n${childrenJsx}\n</div>`;
    }
  }

  async generateProjectZip(projectId: string): Promise<Buffer> {
    const projectQuery = `SELECT * FROM projects WHERE id = $1;`;
    const projectRes = await this.dbService.query(projectQuery, [projectId]);

    if (projectRes.rows.length === 0) {
      throw new NotFoundException(
        `프로젝트 [${projectId}]를 찾을 수 없습니다.`,
      );
    }

    const project = projectRes.rows[0];
    const pages = project.pages || [
      { id: "page_main", name: "Home", nodes: [] },
    ];

    const zip = new JSZip();

    const packageJson = {
      name: `generated-${project.slug || "app"}`,
      version: "1.0.0",
      private: true,
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview",
      },
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
      },
      devDependencies: {
        "@types/react": "^18.2.0",
        "@types/react-dom": "^18.2.0",
        "@vitejs/plugin-react": "^4.0.0",
        typescript: "^5.0.0",
        vite: "^4.3.0",
        tailwindcss: "^3.3.0",
        autoprefixer: "^10.4.0",
        postcss: "^8.4.0",
      },
    };

    zip.file("package.json", JSON.stringify(packageJson, null, 2));

    const mainPage = pages[0];
    const jsxContent = (mainPage.nodes || [])
      .map((node: any) => this.renderNodeToJsx(node))
      .join("\n");

    const appTsx = `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Generated LowCode Application */}
      ${jsxContent}
    </div>
  );
}
`;

    zip.file("src/App.tsx", appTsx);
    zip.file(
      "src/main.tsx",
      `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`,
    );

    zip.file(
      "src/index.css",
      `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
    );

    return await zip.generateAsync({ type: "nodebuffer" });
  }
}
