export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (
      error?.code === "ERR_MODULE_NOT_FOUND" &&
      !specifier.endsWith(".js") &&
      !specifier.endsWith(".json") &&
      !specifier.endsWith(".node") &&
      !specifier.startsWith("node:") &&
      (specifier.startsWith(".") || specifier.startsWith("/"))
    ) {
      return nextResolve(`${specifier}.js`, context);
    }

    throw error;
  }
}
