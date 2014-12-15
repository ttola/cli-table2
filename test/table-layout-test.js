describe('tableLayout', function () {
  var Cell = require('../src/cell');
  var tableLayout = require('../src/table-layout');
  var makeTableLayout = tableLayout.makeTableLayout;
  var maxWidth = tableLayout.maxWidth;
  var fillInTable = tableLayout.fillInTable;
  var chai = require('chai');
  var expect = chai.expect;
  var _ = require('lodash');

  it('simple 2x2 layout',function(){
    var actual = makeTableLayout([
      ['hello','goodbye'],
      ['hola','adios']
    ]);

    var expected = [
      ['hello','goodbye'],
      ['hola','adios']
    ];

    checkLayout(actual,expected);
  });

  it('colSpan adds NoOpCells to the right',function(){
    var actual = makeTableLayout([
      [{content:'hello',colSpan:2}],
      ['hola','adios']
    ]);

    var expected = [
      [{content:'hello',colSpan:2},null],
      ['hola','adios']
    ];

    checkLayout(actual,expected);
  });

  it('rowSpan adds RowSpanCell below',function(){
     var actual = makeTableLayout([
       [{content:'hello',rowSpan:2},'goodbye'],
       ['adios']
     ]);

    var expected = [
      ['hello'            , 'goodbye'],
      [{spannerFor:[0,0]} , 'adios']
    ];

    checkLayout(actual,expected);
  });

  it('rowSpan and cellSpan together',function(){
    var actual = makeTableLayout([
      [{content:'hello',rowSpan:2,colSpan:2},'goodbye'],
      ['adios']
    ]);

    var expected = [
      ['hello'            , null, 'goodbye'],
      [{spannerFor:[0,0]} , null, 'adios']
    ];

    checkLayout(actual,expected);
  });

  it('complex layout',function(){
    var actual = makeTableLayout([
      [{content:'hello',rowSpan:2,colSpan:2},{content:'yo',rowSpan:2,colSpan:2},'goodbye'],
      ['adios']
    ]);

    var expected = [
      ['hello'            , null, 'yo'               , null, 'goodbye'],
      [{spannerFor:[0,0]} , null, {spannerFor:[0,2]} , null, 'adios']
    ];

    checkLayout(actual,expected);
  });

  it('complex layout2',function(){
    var actual = makeTableLayout([
      ['a','b',                          {content:'c',rowSpan:3,colSpan:2},'d'],
      [{content:'e',rowSpan:2,colSpan:2}, 'f'],
      ['g']
    ]);

    var expected = [
      ['a',                 'b',   'c',                 null,  'd'],
      ['e',                 null,  {spannerFor:[0,2]},  null,  'f'],
      [{spannerFor:[1,0]},  null,  {spannerFor:[0,2]},  null,  'g']
    ];

    checkLayout(actual,expected);
  });

  it('maxWidth finds the maximum width of a 2d array',function(){
    expect(maxWidth([[1],[1,2],[]])).to.equal(2);
    expect(maxWidth([[1],[1,2,3],[]])).to.equal(3);
    expect(maxWidth([[1,2,3,4],[1,2],[]])).to.equal(4);
    expect(maxWidth([[1],[1,2],[1,2,3,4,5]])).to.equal(5);
  });

  describe('fillInTable',function(){
    function mc(opts){
      return new Cell(opts);
    }

    it('will blank out individual cells',function(){
      var cells = [
        [null, mc('a')],
        [mc('b'), null]
      ];
      fillInTable(cells);

      checkLayout(cells,[
        ['', 'a'],
        ['b', '']
      ]);
    });

    it('will autospan to the right',function(){
      var cells = [
        [null, null],
        [null, mc('a')]
      ];
      fillInTable(cells);

      checkLayout(cells,[
        [{content:'',colSpan:2}, null],
        ['', 'a']
      ]);
    });

    it('will autospan down',function(){
      var cells = [
        [null, mc('a')],
        [null, null]
      ];
      fillInTable(cells);

      checkLayout(cells,[
        [{content:'',rowSpan:2}, 'a'],
        [{spannerFor:[0,0]}, '']
      ]);
    });

    it('will autospan right and down',function(){
      var cells = [
        [null,  null,    mc('a')],
        [null,  null,    null],
        [null,  mc('b'), null]
      ];
      fillInTable(cells);

      checkLayout(cells,[
        [{content:'',colSpan:2, rowSpan:2}, null, 'a'],
        [{spannerFor:[0,0]}, null, {content:'', colSpan:1, rowSpan:2}],
        ['','b',{spannerFor:[1,2]}]
      ]);
    });

  });

  /**
   * Provides a shorthand for validating a table of cells.
   * To pass, both arrays must have the same dimensions, and each cell in `actualRows` must
   * satisfy the shorthand assertion of the corresponding location in `expectedRows`.
   *
   * Available Expectations Can Be:
   *
   *    * A `String` -  Must be a normal cell with contents equal to the String value.
   *    * `null` -  Must be a NoOpCell
   *
   * Or an `Object` with any of the following properties (multiple properties allowed):
   *    * rowSpan:Number - Must be a normal cell with the given rowSpan.
   *    * colSpan:Number - Must be a normal cell with the given colSpan.
   *    * content:String - Must be a normal cell with the given content.
   *    * spannerFor:[row,col] - Must be a RowSpanCell delegating to the cell at the given coordinates.
   *
   * @param actualRows - the table of cells under test.
   * @param expectedRows - a table of shorthand assertions.
   */
  function checkLayout(actualRows,expectedRows){
    expect(actualRows.length,'number of rows don\'t match').to.equal(expectedRows.length);
    for(var rowIndex = 0; rowIndex < expectedRows.length; rowIndex++){
      var actualColumns = actualRows[rowIndex];
      var expectedColumns = expectedRows[rowIndex];
      expect(actualColumns.length,'number of columns on row ' + rowIndex + ' don\'t match').to.equal(expectedColumns.length);

      for(var columnIndex = 0; columnIndex < expectedColumns.length; columnIndex++){
        var actualCell = actualColumns[columnIndex];
        var expectedCell = expectedColumns[columnIndex];
        if(_.isString(expectedCell)){
          expectedCell = {content:expectedCell};
        }
        var address = '(' + rowIndex + ',' + columnIndex + ')';
        if(expectedCell) {
          if(expectedCell.hasOwnProperty('content')){
            expect(actualCell, address).to.be.instanceOf(Cell);
            expect(actualCell.content,'content of ' + address).to.equal(expectedCell.content);
          }
          if(expectedCell.hasOwnProperty('rowSpan')){
            expect(actualCell, address).to.be.instanceOf(Cell);
            expect(actualCell.rowSpan, 'rowSpan of ' + address).to.equal(expectedCell.rowSpan);
          }
          if(expectedCell.hasOwnProperty('colSpan')){
            expect(actualCell, address).to.be.instanceOf(Cell);
            expect(actualCell.colSpan, 'colSpan of ' + address).to.equal(expectedCell.colSpan);
          }
          if(expectedCell.hasOwnProperty('spannerFor')){
            expect(actualCell, address).to.be.instanceOf(Cell.RowSpanCell);
            expect(actualCell.originalCell).to.equal(
              actualRows[expectedCell.spannerFor[0]][expectedCell.spannerFor[1]]
            );
          }
        } else {
          expect(actualCell, address).to.be.instanceOf(Cell.NoOpCell);
        }
      }
    }
  }

});