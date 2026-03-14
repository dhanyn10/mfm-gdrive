function sliceText(originalName, startNum, endNum) {
    // Basic Javascript slice implementation for filenames
    if (startNum === undefined || startNum === null) return originalName;
    if (endNum === undefined || endNum === null) {
        return originalName.slice(startNum);
    }
    return originalName.slice(startNum, endNum);
}

function padText(originalName, targetLength, padChar, position = 'start') {
    if (!targetLength || !padChar) return originalName;

    // In this simpler iteration (as opposed to finding numbers with regex),
    // we just pad the entire string to the target length
    if (originalName.length >= targetLength) return originalName;

    if (position === 'start') {
        return originalName.padStart(targetLength, padChar);
    } else {
        return originalName.padEnd(targetLength, padChar);
    }
}

module.exports = {
    sliceText,
    padText
};
