import { BASE_URL } from "./config.js"

let tableContainer = document.getElementsByClassName("table-container")[0]

let x_size = 4
let y_size = 4

let bayou_map_data




function setCellName(x, y, name) {
    let cell_name_p = document.querySelector(`[data-x-id="${x}"][data-y-id="${y}"] > .compound-cell-name`)
    cell_name_p.innerHTML = name
}

function setCellScore(x, y, score) {
    let cell_name_p = document.querySelector(`[data-x-id="${x}"][data-y-id="${y}"] > .compound-cell-score`)
    cell_name_p.innerHTML = score
}

function changeMapResolution(size_x, size_y) {
    let table = document.getElementById("table-container")
    table.style["grid-template-columns"] = `repeat(${size_x}, ${size_x}fr)`
    table.style["grid-template-rows"] = `repeat(${size_y}, ${size_y}fr)`
}

function addCells(size_x, size_y) {
    for (let i = 1; i <= size_y; i++) {
        for (let j = 1; j <= size_x; j++) {
            let compound_cell = document.createElement("div")
            compound_cell.classList.add("compound-cell")
            compound_cell.dataset.xId = j
            compound_cell.dataset.yId = i
            compound_cell.dataset.populated = "false"
            compound_cell.dataset.blackout = "false"
            compound_cell.addEventListener("click", (event) => {
                if (event.currentTarget.dataset.blackout == "false") {
                    event.currentTarget.classList.toggle("compound-cell-selected")
                }
            })
            let name_span = document.createElement("p")
            name_span.classList.add("compound-cell-name")
            let score_span = document.createElement("p")
            score_span.classList.add("compound-cell-score")
            compound_cell.appendChild(name_span)
            compound_cell.appendChild(score_span)
            tableContainer.appendChild(compound_cell)
        }
    }
}

function removeCells() {
    let table = document.getElementById("table-container")
    while (table.firstChild) {
        table.removeChild(table.lastChild)
    }
}

function setupMap(map_data) {
    let size_x = map_data.max_width
    let size_y = map_data.max_height

    let x_to_y_ratio = size_x / size_y
    document.getElementById("btn-reset").dataset.ratio = x_to_y_ratio
    console.log(document.getElementById("btn-reset"))

    changeMapResolution(size_x, size_y)
    addCells(size_x, size_y)

    for (let compound of map_data.compounds) {
        let compound_cell = document.querySelector(`[data-x-id="${compound.pos_x}"][data-y-id="${compound.pos_y}"]`)
        compound_cell.dataset.populated = "true"
        setCellName(compound.pos_x, compound.pos_y, compound.name)
    }

    let empty_cells = document.querySelectorAll(`[data-populated="false"]`).forEach((cell) => {
        cell.dataset.blackout = "unset"
    })
}

function calculateScoreBetweenCoordinates(x1, y1, x2, y2, ratio) {
    // Score - is distance between two compounds
    // ratio - correction for map resolution since in-game map is 1km by 1km, 
    // and our resolution can be not squred (e.g. 5x7 for bayou)
    // ratio is inversed and applied to x in cases our resolution is wider (max y > max x)
    let ratio_x = ratio > 1 ? 1 : Math.pow(ratio, -1)
    let ratio_y = ratio > 1 ? ratio : 1
    return Math.ceil(Math.sqrt(Math.pow((x1 - x2) * ratio_x, 2) + Math.pow((y1 - y2) * ratio_y, 2)))

}

function calculateScores(ratio) {
    let blackout_cells = document.querySelectorAll(`[data-blackout="true"]`)
    let possible_cells = document.querySelectorAll(`[data-blackout="false"]`)
    let sum_of_scores = 0
    let results = []
    for (let pcell of possible_cells) {
        let score = 0
        let x1 = pcell.dataset.xId
        let y1 = pcell.dataset.yId
        for (let bcell of blackout_cells) {

            let x2 = bcell.dataset.xId
            let y2 = bcell.dataset.yId
            let t_score = calculateScoreBetweenCoordinates(x1, y1, x2, y2, ratio)
            score += t_score
        }
        // setCellScore(pcell.dataset.xId, pcell.dataset.yId, score)
        sum_of_scores += score
        results.push([x1, y1, score])
    }

    for (let bcell of blackout_cells) {
        setCellScore(bcell.dataset.xId, bcell.dataset.yId, " ")
    }
    console.log(results)
    for (let result of results) {
        console.log(result)
        setCellScore(result[0], result[1], `${((result[2] / sum_of_scores) * 100).toFixed(2)}%`)
    }
}

function fetchMapDataAndSetup(map_name) {
    fetch(`${window.location.href}/data/maps/${map_name}.json`)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            console.log(data)
            setupMap(data)
        });
}

////Setup
//Map select
document.getElementsByName("map-select").forEach((radio) => {
    radio.addEventListener("click", (event) => {
        removeCells()
        fetchMapDataAndSetup(event.currentTarget.value)
    })
})

//Blackout button
document.getElementById("btn-blackout").addEventListener("click", (event) => {
    document.querySelectorAll(".compound-cell-selected").forEach((cell) => {
        cell.classList.remove("compound-cell-selected")
        cell.dataset.blackout = "true"
    })
    let ratio = parseFloat(document.getElementById("btn-reset").dataset.ratio)
    calculateScores(ratio)
})

//Reset button
document.getElementById("btn-reset").addEventListener("click", (event) => {
    document.querySelectorAll(".compound-cell-blackout").forEach((cell) => {
        cell.classList.remove("compound-cell-blackout")
        cell.classList.remove("compound-cell-selected")
    })
})

//----------------------------

fetchMapDataAndSetup("bayou")
