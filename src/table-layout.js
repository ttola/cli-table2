var _ = require('lodash');
var Cell = require('./cell');


function makeTableLayout(rows){
  var cellRows = generateCells(rows);
  expandCells(cellRows);
  return cellRows;
}

function expandCells(cellRows){
  for(var rowIndex = cellRows.length-1; rowIndex >= 0; rowIndex--){
    var cellColumns = cellRows[rowIndex];
    for(var columnIndex = 0; columnIndex < cellColumns.length; columnIndex++){
      var cell = cellColumns[columnIndex];
      for(var k = 1; k < cell.colSpan; k++){
        cellColumns.splice(columnIndex+1,0,new Cell.NoOpCell());
      }
      for(var i = 1; i < cell.rowSpan; i ++){
        var insertionRow = cellRows[rowIndex + i];
        var spliceArgs = [columnIndex,0,new Cell.RowSpanCell(cell)];
        for(var j = 1; j < cell.colSpan; j++){
          spliceArgs.push(new Cell.NoOpCell());
        }
        insertionRow.splice.apply(insertionRow,spliceArgs);
      }
    }
  }
}

function fillInTable(rows){
  var height = rows.length;
  var width = maxWidth(rows);
  for(var rowIndex = 0; rowIndex < height; rowIndex++){
    var row = rows[rowIndex];
    for(var colIndex = 0; colIndex < width; colIndex++){
      var cell = row[colIndex];
      if(!cell){
        var i = colIndex+1;
        while(i < width && !row[i]){
          row[i] = new Cell.NoOpCell();
          i++;
        }
        var j = rowIndex + 1;
        while(j < height && allBlank(rows[j],colIndex,i)){
          for(var k = colIndex+1; k < i; k++){
            rows[j][k] = new Cell.NoOpCell();
          }
          j++;
        }
        var rowSpan = j - rowIndex;
        var blankCell = new Cell(
          {colSpan:i-colIndex,rowSpan: rowSpan}
        );
        row[colIndex] = blankCell;
        for(var n = 1; n < rowSpan; n++){
          rows[rowIndex+n][colIndex] = new Cell.RowSpanCell(blankCell);
        }
      }
    }
  }
}

function allBlank(row,from,to){
  for(var i = from; i < to; i++){
    if(row[i]) return false;
  }
  return true;
}

function generateCells(rows){
  return _.map(rows,function(row){
    return _.map(row,function(cell){
      return new Cell(cell);
    });
  });
}

function maxWidth(rows){
  return _.reduce(rows,function(maxWidth,row){
    return Math.max(maxWidth,row.length);
  },0);
}

module.exports = {
  makeTableLayout:makeTableLayout,
  maxWidth:maxWidth,
  fillInTable:fillInTable
};