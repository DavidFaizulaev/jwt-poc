function formatDate(expirationDate){
    if (expirationDate === undefined){
        return;
    }
    const delimiter = expirationDate[2];
    const dateParts = expirationDate.split(delimiter);
    const month = dateParts[0];
    let year = dateParts[1];

    if (year.length === 2) { year = `20${year}` }

    return month + '/' + year;
}

module.exports = {
    formatDate: formatDate
};
