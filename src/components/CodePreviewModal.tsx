import React, { useState, useEffect } from "react";
import axios from "axios";
import { useEditorStore } from "../store/useEditorStore";
import { X, Copy, Check, Code2, Smartphone, Globe } from "lucide-react";

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { rootNode } = useEditorStore();
  const [target, SetTarget] = useState<"rn" | "react">("rn");
  const [code, setCode] = useState<string>("코드 생성 중...");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCompiledCode = async () => {
      setLoading(true);

      try {
        const response = await axios.post(
          `http://localhost:3000/api/generator/compile?target=${target}`,
          {
            pageName: "home",
            ast: rootNode,
          },
        );
        setCode(response.data.code);
      } catch (error) {
        console.error("Code generation failed:", error);
        setCode("코드 생성 실패");
      } finally {
        setLoading(false);
      }
    };

    fetchCompiledCode();
  }, [isOpen, target, rootNode]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-slate-100">
              Generated TSX Source Code
            </h2>
          </div>

          {/* Platform Tab Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 space-x-1">
            <button
              onClick={() => setTarget("rn")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                target === "rn"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>React Native</span>
            </button>
            <button
              onClick={() => setTarget("react")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                target === "react"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>React Web</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Code View) */}
        <div className="relative flex-1 p-6 bg-slate-950 overflow-auto font-mono text-xs text-slate-300 leading-relaxed">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-500 space-x-2">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>백엔드 UI 컴파일러 엔진 작동 중...</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap">{code}</pre>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3 bg-slate-900">
          <span className="text-xs text-slate-500">
            Target:{" "}
            <strong className="text-slate-300 font-mono">
              {target === "rn" ? "React Native (.tsx)" : "React Web (.tsx)"}
            </strong>
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-medium transition border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>코드 복사</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
