exports.handler = async (event) => {
  const text = event.text || "";
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return { text, wordCount };
};