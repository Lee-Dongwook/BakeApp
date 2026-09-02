/** Formats generated TSX before it is displayed, copied, or downloaded. */
export const formatGeneratedCode = async (code: string) => {
  const [prettier, estreePlugin, typescriptPlugin] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/estree"),
    import("prettier/plugins/typescript"),
  ]);

  return prettier.format(code, {
    parser: "typescript",
    plugins: [typescriptPlugin, estreePlugin],
    printWidth: 88,
    tabWidth: 2,
    semi: true,
    singleQuote: true,
    trailingComma: "all",
  });
};
