// Select the SVG canvas and get its dimensions
const svg = d3.select("#voronoiCanvas");
const width = +svg.attr("width");
const height = +svg.attr("height");

// Initialize variables for game logic
let points = [];
let currentPlayer = 'green';  // Alternates between 'green' and 'red'
let greenCells = 0;
let redCells = 0;
const maxCellsPerPlayer = 10;
let remainingCells = 20;  // Total number of cells
const players = {
    green: { color: "hsl(120, 60%, 70%)", darkColor: "darkgreen" },
    red: { color: "hsl(0, 60%, 70%)", darkColor: "darkred" }
};

// Create separate layers for Voronoi cells and points for better organization
const cellLayer = svg.append('g');
const pointLayer = svg.append('g');

// Append tooltip div
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");

// Click handler for adding points
svg.on("click", function(event) {
    if (greenCells < maxCellsPerPlayer || redCells < maxCellsPerPlayer) {
        if (event.target.tagName !== 'circle') {
            const [x, y] = d3.pointer(event);
            points.push({ point: [x, y], player: currentPlayer });
            if (currentPlayer === 'green') {
                greenCells++;
            } else {
                redCells++;
            }
            currentPlayer = currentPlayer === 'green' ? 'red' : 'green';  // Switch player
            remainingCells--;  // Decrease remaining cells
            updateCountdown();  // Update the countdown display
            drawVoronoi();

            // End the game after the red player places 10 cells
            if (redCells === maxCellsPerPlayer) {
                endGame();
            }
        }
    }
});

// Function to calculate polygon area
function calculateArea(polygon) {
    return Math.abs(d3.polygonArea(polygon));
}

// Function to calculate total area of all Voronoi cells
function calculateTotalArea() {
    return width * height;
}

// Function to draw or update the Voronoi diagram
function drawVoronoi() {
    // If there are no points, clear the canvas
    if (points.length === 0) {
        cellLayer.selectAll("path").remove();
        pointLayer.selectAll("circle").remove();
        updateScoreboard(0, 0);
        return;
    }

    // Create Delaunay triangulation and Voronoi diagram
    const delaunay = d3.Delaunay.from(points.map(p => p.point));
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    // Prepare data with point coordinates and their indices
    const pointsWithIndex = points.map((p, index) => ({ ...p, index }));

    // Calculate areas of all Voronoi cells
    let greenArea = 0;
    let redArea = 0;
    const totalArea = calculateTotalArea();

    pointsWithIndex.forEach(d => {
        const cellPolygon = voronoi.cellPolygon(d.index);
        if (cellPolygon) {
            const area = calculateArea(cellPolygon);
            if (d.player === 'green') {
                greenArea += area;
            } else if (d.player === 'red') {
                redArea += area;
            }
        }
    });

    // Update the scoreboard
    const greenPercentage = ((greenArea / totalArea) * 100).toFixed(2);
    const redPercentage = ((redArea / totalArea) * 100).toFixed(2);
    updateScoreboard(greenPercentage, redPercentage);

    // Bind data for Voronoi cells
    const cellPaths = cellLayer.selectAll("path")
        .data(pointsWithIndex, d => d.index);

    // Remove exiting cells
    cellPaths.exit().remove();

    // Update existing cells
    cellPaths
        .attr("d", d => voronoi.renderCell(d.index))
        .attr("fill", d => players[d.player].color)
        .attr("stroke", "#000");

    // Add new cells
    cellPaths.enter()
        .append("path")
        .attr("d", d => voronoi.renderCell(d.index))
        .attr("fill", d => players[d.player].color)
        .attr("stroke", "#000");

    // Bind data for points (circles)
    const circles = pointLayer.selectAll("circle")
        .data(pointsWithIndex, d => d.index);

    // Remove exiting points
    circles.exit().remove();

    // Update existing points
    circles
        .attr("cx", d => d.point[0])
        .attr("cy", d => d.point[1])
        .attr("fill", d => players[d.player].darkColor);

    // Add new points
    circles.enter()
        .append("circle")
        .attr("cx", d => d.point[0])
        .attr("cy", d => d.point[1])
        .attr("r", 5)
        .attr("fill", d => players[d.player].darkColor);
}

// Function to update the scoreboard
function updateScoreboard(greenPercentage, redPercentage) {
    document.getElementById('greenArea').textContent = `${greenPercentage}%`;
    document.getElementById('redArea').textContent = `${redPercentage}%`;
}

// Function to update the countdown display
function updateCountdown() {
    document.getElementById('remainingCells').textContent = remainingCells;
}

// Function to display the winner when the game ends
function endGame() {
    const greenPercentage = parseFloat(document.getElementById('greenArea').textContent);
    const redPercentage = parseFloat(document.getElementById('redArea').textContent);

    const endMessageDiv = document.getElementById('endGameMessage');
    let winnerText;
    let winnerColor;

    if (greenPercentage > redPercentage) {
        winnerText = "Green Player Wins!";
        winnerColor = players.green.darkColor;
    } else if (redPercentage > greenPercentage) {
        winnerText = "Red Player Wins!";
        winnerColor = players.red.darkColor;
    } else {
        winnerText = "It's a Draw!";
        winnerColor = "#333";  // Neutral color for a draw
    }

    // Show the end game message
    endMessageDiv.textContent = winnerText;
    endMessageDiv.style.color = winnerColor;
    endMessageDiv.style.visibility = 'visible';  // Ensure message becomes visible
}

// Reset button handler
document.getElementById('resetButton').addEventListener('click', function() {
    points = [];
    greenCells = 0;
    redCells = 0;
    remainingCells = 20;  // Reset remaining cells
    currentPlayer = 'green';
    document.getElementById('endGameMessage').style.visibility = 'hidden';  // Hide message on reset
    updateCountdown();  // Reset countdown display
    drawVoronoi();
});

// Initial draw in case there are pre-existing points
drawVoronoi();
