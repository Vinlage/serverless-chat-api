exports.handler = async (event) => {
    const text = JSON.parse(event.body).text;

    // Example logic
    const wordCount = text.split(" ").length;

    // Correct proxy response
    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, wordCount })
    };
};