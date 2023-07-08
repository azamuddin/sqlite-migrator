const config = {
  compilationOptions: {
    preferredConfigPath: './tsconfig.json',
  },
  entries: [
    {
      filePath: './src/index.ts',
      outFile: `./dist/index.d.ts`,
      noCheck: true,
    },
  ],
};

module.exports = config;
