// To add default datasets or feature sets: make sure that the dataset or
// featureset is in the appropriate directory, then add the filename (minus the
// .csv extension; spaces aren't allowed) to the appropriate list below

const default_datasets = ["AncientGreekIPA", "Catalan2IPA", "Catalan",
    "CatalanIPA", "EnglishIPA", "EstonianIPA", "Farsi2IPA", "Finnish2IPA",
    "Finnish", "FinnishIPA", "GreekIPA", "GreekIPA-glossed", "GreekIPA-pal",
    "HungarianIPA", "JapaneseIPA", "KenyangIPA", "KikuriaIPA", "KipsigisIPA",
    "Korean2IPA", "Korean3IPA", "Lamba", "MakondeIPA", "MixtecIPA",
    "NorthernSamiIPA", "Polish2IPA", "Polish", "SerboCroatianIPA", "ShonaIPA",
    "Somali", "SpanishIPA", "Turkish", "TurkishPS1", "TurkishPS2", "UkrainianIPA",
    "XavanteIPA", "Yidiny2IPA", "YidinyIPA"
];

const default_featuresets = ["default"]

const converter = new showdown.Converter({ 'simpleLineBreaks': 'true', 'headerLevelStart': 2 });
converter.setFlavor('github');

let dataset = null;
let featurearray = null;

let title = $("#title");
let description = $("#description");
let dataset_upload = $("#dataset-selector");
let dataset_table = $("#dataset-display");

let features_upload = $("#featureset-selector");
let features_table = $("#featureset-display");

let printonly_table = $("#printonly-table")

function isGloss(str) {
    str = str.toUpperCase();
    return str.includes("GLOSS") || str.includes("LEXEME")
}

function loadBuiltin(name) {
    $.ajax({
        "url": `datasets/${name}.csv`,
        "success": (res) => {
            populateData(res);
            $("#dataset-info").text(`${name}.csv`);
        }
    });
}

function loadFeatures(name) {
    $.ajax({
        "url": `featuresets/${name}.csv`,
        "success": (res) => {
            populateFeatures(res);
            $("#featureset-info").text(`${name}.csv`);
        }
    });
}

let populateData = (input) => {
    dataset = $.csv.toArrays(input);
    let numRows = dataset.length;
    let numCols = dataset[0].length;

    // manually constructing table html heck yeah
    let html = '';

    // header row
    html += "<thead>\n<tr>\n";
    html += "<th class=\"sticky\"></th>\n"

    for (let col = 0; col < numCols; col++) {
        let cellClass = "";

        if (isGloss(dataset[0][col]))
            cellClass += ` class="gloss"`

        html += `<th${cellClass} id="cell-0-${col}"
            contenteditable=true>${dataset[0][col]}</th>\n`
    }

    html += "</tr>\n</thead>\n<tbody>\n";

    // checkbox row
    html += "<tr>\n";
    html += `<td class="sticky">Include?</td>`

    for (let col = 0; col < numCols; col++) {
        let cellClass = "";

        if (isGloss(dataset[0][col]))
            cellClass += ` class="gloss"`

        html += `<td${cellClass}><input type="checkbox" class="form-check-input"
            checked id="include-col-${col + 1}"></td>\n`
    }

    html += "</tr>\n";

    for (let i = 1; i < numRows; i++) {
        html += "<tr>\n";
        html += `<td class=\"sticky\"><input type="checkbox"
            class="form-check-input" checked id="include-row-${i}"></td>\n`

        for (let j = 0; j < numCols; j++) {
            let cellClass = "";

            if (isGloss(dataset[0][j]))
                cellClass += ` class="gloss"`

            html += `<td${cellClass} id="cell-${i}-${j}"
                contenteditable=true>${dataset[i][j]}</td>\n`
        }
        html += "</tr>\n";
    }
    html += "</tbody>";

    $("#select-control-buttons").show();
    $("#table-nothing-yet").hide();
    dataset_table.html(html);
}

let populateFeatures = (input) => {
    // pass in null to populate if you've already set `featureset`
    if (input)
        featureset = $.csv.toArrays(input);
    let numRows = featureset.length;
    let numCols = featureset[0].length;

    // manually constructing table html heck yeah
    let html = '';

    for (let i = 0; i < numRows; i++) {
        if (i == 0) {
            html += `<thead>\n`;
            html += "<tr>\n";
        } else
            html += "<tr>\n";

        if (i == 0) {
            html += `<th class="sticky">${featureset[i][0]}</th>\n`
            html += "<th colspan=3>Select</td>\n"
            html += "<th colspan=3>Deselect</td>\n"
        } else {
            html += `<td class="font-weight-bold sticky">${featureset[i][0]}</td>\n`
            for (let j = 0; j < 6; j++) {
                let caption;
                if (j == 0 || j == 3) caption = "+";
                if (j == 1 || j == 4) caption = "0";
                if (j == 2 || j == 5) caption = "-";

                html += `<td><button class="btn btn-secondary btn-sm" id=feature-${i}-${j + 1}>${caption}</button></td>\n`
            }
        }

        for (let j = 1; j < numCols; j++) {
            if (i == 0)
                html += `<th>${featureset[i][j]}</th>\n`
            else
                html += `<td>${featureset[i][j]}</td>\n`
        }
        html += "</tr>\n";

        if (i == 0)
            html += "</thead>\n<tbody>\n";
    }
    html += "</tbody>";

    features_table.html(html);

    for (let i = 1; i < numRows; i++) {
        for (let j = 1; j < 7; j++) {
            let value;
            if (j == 1 || j == 4) value = "+"
            if (j == 2 || j == 5) value = "0"
            if (j == 3 || j == 6) value = "-"

            $(`#feature-${i}-${j}`).click((evt) => {
                evt.preventDefault();
                massSelectMatching(j < 4, value, i);
            });
        }
    }
}

function populateDefaultDatasets() {
    let count = 0;
    let html = "";

    const classes = `class="col-md-3 m-1 btn btn-outline-primary builtins-cell"`
    for (let dataset of default_datasets) {
        if (count == 0)
            html += `<div class="row m-1 builtins-row">\n`;

        html += `<a ${classes} id="${dataset}-data">${dataset}</a>\n`;

        if (count == 3)
            html += `</div>\n`;
        count = (count + 1) % 4;
    }
    if (count != 0)
        html += `</div>\n`;

    $("#builtin-datasets").html(html);

    for (let dataset of default_datasets) {
        $(`#${dataset}-data`).click(() => loadBuiltin(dataset));
    }
}

function populateDefaultFeaturesets() {
    let count = 0;
    let html = "";

    const classes = `class="col-md-3 m-1 btn btn-outline-primary builtins-cell"`
    for (let features of default_featuresets) {
        if (count == 0)
            html += `<div class="row m-1 builtins-row">\n`;

        html += `<a ${classes} id="${features}-features">${features}</a>\n`;

        if (count == 2)
            html += `</div>\n`;
        count = (count + 1) % 3;
    }
    if (count != 0)
        html += `</div>\n`;

    $("#builtin-featuresets").html(html);

    for (let features of default_featuresets) {
        $(`#${features}-features`).click(() => loadFeatures(features));
    }
}

let updateTitleAndDescription = (evt) => {
    $("#printonly-title").html(title.val());
    let parsed = converter.makeHtml(description.val());
    $("#printonly-description").html(parsed);
}

let updatePrintTable = (evt) => {
    if (!dataset)
        return;

    // manually constructing html again heck yeah
    let html = '';
    let count = 0;
    let numRows = dataset.length;
    let numCols = dataset[0].length;

    for (let i = 0; i < numRows; i++) {
        if (i == 0) {
            html += "<thead>\n";
            html += "<tr>\n";
            html += "<th>#</th>\n"
        }

        else {
            // skip rows that aren't selected
            if (!$(`#include-row-${i}`).prop("checked"))
                continue;

            count++;
            html += "<tr>\n";
            html += `<td>${count}</td>\n`
        }

        for (let j = 0; j < numCols; j++) {
            // skip cols that aren't selected
            if (!$(`#include-col-${j + 1}`).prop("checked"))
                continue;

            let cellClass = "";

            if (isGloss(dataset[0][j]))
                cellClass = " class=\"gloss\""

            if (i == 0)
                html += `<th${cellClass}>${$(`#cell-${i}-${j}`).text()}</th>\n`
            else
                html += `<td${cellClass}>${$(`#cell-${i}-${j}`).text()}</td>\n`
        }
        html += "</tr>\n";

        if (i == 0)
            html += "</thead>\n<tbody>\n";
    }
    html += "</tbody>";

    printonly_table.html(html);
}

/* 
Expects:
which: boolean; true = select this, false = deselect this
dimension: "row" or "col"
*/
let massSelect = (which, dimension) => {
    if (!dataset) return;
    if (dimension != "row" && dimension != "col") return;

    for (let i = 1; i < dataset.length; i++)
        $(`#include-${dimension}-${i}`).prop('checked', which);
}

/* 
Expects these types:
select: boolean; true = select this, false = deselect this
value: string; "+", "0", or "-"
feature: int; index into featureset
*/
let massSelectMatching = (select, value, feature) => {
    if (!dataset || !featureset)
        return;

    let row = featureset[feature];
    let matching = []; // will be an array of matching strings

    for (let i = 1; i < row.length; i++) {
        if (row[i].trim() == value) {
            matching.push(featureset[0][i]);
        }
    }

    // select or unselect all matching entries
    for (let i = 1; i < dataset.length; i++) {
        let joined = "";
        for (const index in dataset[i]) {
            const word = dataset[i][index];
            if (!isGloss(dataset[0][index]))
                joined += word + ",";
        }

        matching.forEach((potentialMatch, index) => {
            if (joined.includes(potentialMatch)) {
                $(`#include-row-${i}`).prop('checked', select);
            }
        });
    }

    return null;
}

$(document).ready(() => {
    $("#select-control-buttons").hide();

    $.ajax({
        "url": `featuresets/default.csv`,
        "success": (res) => {
            // default features
            featureset = $.csv.toArrays(res);
            populateFeatures(null);
        }
    });

    populateDefaultDatasets();
    populateDefaultFeaturesets();

    // Set up listeners
    title.change(updateTitleAndDescription);
    description.change(updateTitleAndDescription);

    dataset_upload.change((ev) => {
        ev.preventDefault();

        let file = dataset_upload[0].files[0];

        if (file) {
            let reader = new FileReader();
            reader.readAsText(file, "UTF-8");
            reader.onload = (evt) => populateData(evt.target.result);
            reader.onerror = function (evt) { /* TODO */ }
        }
    });

    features_upload.change((ev) => {
        ev.preventDefault();
        let file = features_upload[0].files[0];

        if (file) {
            let reader = new FileReader();
            reader.readAsText(file, "UTF-8");
            reader.onload = (evt) => populateFeatures(evt.target.result);
            reader.onerror = function (evt) { /* TODO */ }
        }
    });

    $("#select-all-rows").click(() => massSelect(true, "row"));
    $("#select-no-rows").click(() => massSelect(false, "row"));
    $("#select-all-cols").click(() => massSelect(true, "col"));
    $("#select-no-cols").click(() => massSelect(false, "col"));

    window.onbeforeprint = updatePrintTable;

    updateTitleAndDescription();
    updatePrintTable();
})