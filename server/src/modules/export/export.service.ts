import { Injectable, NotFoundException } from "@nestjs/common";
import JSZip from "jszip";
import { ProjectService } from "../project/project.service";
import { ProjectDocumentService } from "../project/project-document.service";
import { GeneratorService } from "../generator/generator.service";

@Injectable()
export class ExportService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly projectDocumentService: ProjectDocumentService,
    private readonly generatorService: GeneratorService,
  ) {}

  async generateProjectZip(projectId: string): Promise<Buffer> {
    const project = await this.projectService.findById(projectId);
    if (!project) {
      throw new NotFoundException(`프로젝트 [${projectId}]를 찾을 수 없습니다.`);
    }

    const { document } = await this.projectDocumentService.findByProjectId(projectId);
    const rawPages = (document.pages as any[]) || [];
    const pages = rawPages.length > 0
      ? rawPages
      : [
          {
            id: "page-home",
            name: "Home",
            path: "/",
            rootNode: {
              id: "root",
              type: "Container",
              name: "Home Screen",
              style: { padding: 16, backgroundColor: "#ffffff" },
              children: [
                {
                  id: "text-1",
                  type: "Text",
                  name: "Title",
                  children: [`${project.name} - Generated App`],
                },
              ],
            },
          },
        ];

    const zip = new JSZip();

    const packageJson = {
      name: `bakeapp-${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "exported"}`,
      version: "1.0.0",
      private: true,
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview",
      },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "lucide-react": "^1.38.0",
      },
      devDependencies: {
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "@vitejs/plugin-react": "^4.3.4",
        typescript: "^5.7.2",
        vite: "^6.0.0",
        tailwindcss: "^4.0.0",
        "@tailwindcss/vite": "^4.0.0",
      },
    };

    zip.file("package.json", JSON.stringify(packageJson, null, 2));

    const tsconfigJson = {
      compilerOptions: {
        target: "ES2022",
        useDefineForClassFields: true,
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
      },
      include: ["src"],
    };
    zip.file("tsconfig.json", JSON.stringify(tsconfigJson, null, 2));

    const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`;
    zip.file("vite.config.ts", viteConfig);

    const indexHtml = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${project.name}</title>
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
    zip.file("index.html", indexHtml);

    const mainTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
    zip.file("src/main.tsx", mainTsx);

    const indexCss = `@import "tailwindcss";

body {
  font-family: Inter, Pretendard, system-ui, sans-serif;
}
`;
    zip.file("src/index.css", indexCss);

    // Generate page files
    const pageImports: string[] = [];
    const pageComponents: { id: string; name: string; path: string; compName: string }[] = [];

    pages.forEach((page, idx) => {
      const compName = `${page.name.replace(/[^a-zA-Z0-9]+/g, "") || "Page"}${idx + 1}`;
      const code = this.generatorService.generateReactWeb(page.name, page.rootNode || page);
      zip.file(`src/pages/${compName}.tsx`, code);
      pageImports.push(`import ${compName} from './pages/${compName}';`);
      pageComponents.push({ id: page.id, name: page.name, path: page.path || `/${page.name.toLowerCase()}`, compName });
    });

    const appTsx = `import React, { useState } from 'react';
${pageImports.join("\n")}

export default function App() {
  const [activePageId, setActivePageId] = useState('${pageComponents[0]?.id || ""}');

  const pages = ${JSON.stringify(pageComponents, null, 2)};

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Navigation Bar */}
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center space-x-3">
          <span className="text-xl">🍞</span>
          <h1 className="font-bold text-sm tracking-wide">${project.name}</h1>
        </div>
        <nav className="flex items-center space-x-1">
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePageId(p.id)}
              className={\`px-3 py-1.5 rounded-lg text-xs font-semibold transition \${
                activePageId === p.id
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }\`}
            >
              {p.name}
            </button>
          ))}
        </nav>
      </header>

      {/* Screen Content */}
      <main className="flex-1 p-6 flex justify-center items-start">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          ${pageComponents
            .map(
              (p) =>
                `{activePageId === '${p.id}' && <${p.compName} />}`,
            )
            .join("\n          ")}
        </div>
      </main>
    </div>
  );
}
`;
    zip.file("src/App.tsx", appTsx);

    const readmeMd = `# ${project.name} (BakeApp Export)

이 프로젝트는 **BakeApp Studio**에서 자동 생성되어 내보내진 독립 실행형 React + Vite 웹 애플리케이션입니다.

## 시작하기

\`\`\`bash
# 1. 의존성 설치
npm install # 또는 pnpm install

# 2. 로컬 개발 서버 실행
npm run dev

# 3. 배포 빌드
npm run build
\`\`\`
`;
    zip.file("README.md", readmeMd);

    return await zip.generateAsync({ type: "nodebuffer" });
  }
}
