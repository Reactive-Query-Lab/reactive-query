vi.stubGlobal("URL", {
  createObjectURL: (file: File) => file.name,
  revokeObjectURL: (image: string) => image,
});
