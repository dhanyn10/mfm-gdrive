function sliceText(originalName, startNum, endNum) {
    if (startNum === undefined || startNum === null) return originalName;
    // Original behavior: remove characters between startNum and endNum
    if (endNum === undefined || endNum === null) {
        return originalName.slice(0, startNum);
    }
    return originalName.slice(0, startNum) + originalName.slice(endNum);
}

function padText(originalName, targetLength, padChar, position = 'start') {
    if (!targetLength || !padChar) return originalName;

    // Original behavior: pad the first number found in the filename
    return originalName.replaceAll(/\d+/g, (match) => {
        if (match.length >= targetLength) return match;
        if (position === 'start') {
            return match.padStart(targetLength, padChar);
        } else {
            return match.padEnd(targetLength, padChar);
        }
    });
}

module.exports = {
    sliceText,
    padText
};
