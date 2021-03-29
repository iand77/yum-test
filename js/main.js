"use strict"

function Grid(settings) {

    // Create a new object of settings if not an object
    settings = typeof(settings) === "object" && 
               settings != null ? settings : {};

    var gridWidth       = settings.width || 10,
        gridHeight      = settings.width || 10,
        gridArray       = settings.gridArray;
        
    if (gridArray === undefined) {

        gridArray = 
            this._generateGridArray(gridWidth, gridHeight);

    } else if (!Array.isArray(gridArray) || 
               !Array.isArray(gridArray[0])) {

        throw new 
            TypeError('`gridArray` settings needs to be array with two dimensions');

    }

    settings.width      = gridWidth;
    settings.height     = gridHeight;
    settings.gridArray  = gridArray;
    
    // Used as hash table to store visited blocks
    this._hash = [];

    // Save settings in Object
    this.settings = settings;
}

/**
 * Function to dynamically create/update CSS style tag in <head>
 */
Grid.prototype.refresh = function() {

    var 
        styleCSS,
        styleId     = 'grid__' + this.settings.id,
        styleElem   = document.querySelector('style#' + styleId),
        parent      = '#' + this.settings.id + '.grid',
        dimension   = 100 / this.settings.width,
        width       = Math.floor(dimension * 100) / 100, 
        height      = width;

    // CSS string to insert into <style> tag
    styleCSS =   
        parent + ' {\n' +
            '\twidth:   100%;\n' +
            '\theight:  100%;\n' +
        '}\n\n' +

        parent + ':after {\n' + 
            '\tcontent: "";\n' + 
            '\tdisplay: table;\n' +
            '\tclear: both;\n' +
        '}\n\n' + 
              
        parent + ' .grid__block {\n' + 
            '\tfloat: left;\n' + 
            '\tbackground-color: ' + this.settings.color.background + ';\n' + 
            '\tborder: 1px solid white;\n' + 
            '\t-webkit-box-sizing:  border-box;\n' + 
            '\t        box-sizing:  border-box;\n' + 
            '\twidth: ' + width + '%;\n' + 
            '\theight: ' + height + '%;\n' + 
            '\tposition: relative;\n' +
            '\ttext-align: center;\n' +
        '}\n\n' +

        parent + ' .grid__block > span {\n' + 
            '\ttop: 50%;\n' +
            '\tdisplay: block;\n' +
            '\tposition: absolute;\n' +
            '\twidth: 100%;\n' +
            '\tmargin-top: -5px;\n' +
            '\tline-height: 10px;\n' +
            '\tcolor: white;\n' +
            '\tpointer-events:none;\n' +
        '}\n\n' +
          
        parent + ' .grid__block[yum-is-block="1"] {\n' +
            '\tbackground-color: ' + this.settings.color.box + ';\n' +
        '}\n\n' +
              
        parent + ' .grid__block--hover[yum-is-block="1"] {\n' +
            '\tcursor: pointer;\n' +
            '\tbackground-color: ' + this.settings.color.hover + ';\n' +
        '}\n\n';

    // If the <style> tag doesn't exist then create one 
    if (!styleElem) {
        styleElem      = document.createElement("style");
        styleElem.id   = styleId;
        styleElem.type = "text/css";
        document.head.appendChild(styleElem)
    }
    
    // Update the <style> tag CSS contents
    if (styleElem.styleSheet) {
        styleElem.styleSheet.cssText = styleCSS;
    } else {
        styleElem.innerHTML = '';
        styleElem.appendChild(document.createTextNode(styleCSS));
    }
}

/**
 * Generates a 2D array with `width` x `height` dimensions
 * 
 * @param {int} width how many elements in each row
 * @param {int} height total rows
 */
Grid.prototype._generateGridArray = function(width, height) {

    var x,
        y,
        gridArray = new Array(width);
    
    for(x = 0; x < width; x++) {

        gridArray[x] = new Array(height);
        
        for(y = 0; y < height; y++) {

            gridArray[x][y] = Math.round(Math.random());

        }    

    }

    return gridArray;

}

/**
 * Renders the grid into HTML container
 * 
 * @param {HTMLElement} container (optional) Container to render grid into
 */
Grid.prototype.render = function(container) {

    var gridBlock,
        gridArray       = this.settings.gridArray,
        gridContainer   = this.settings.container || container,
        thisRef         = this,
        grid,
        x,
        y;

    if (gridContainer === undefined) {

        throw new 
            ReferenceError('`container` argument missing or does not exist.' +
                           'Please set in constructor or pass as argument ' +
                           'in render function.');
    }

    // Clear grid - garbage collector will remove all assigned event listeners
    gridContainer.innerHTML = '';
    
    grid = document.createElement('div');
    grid.setAttribute('id', this.settings.id);
    grid.setAttribute('class', 'grid');
    gridContainer.appendChild(grid);
    
    // Add CSS styling <style> tag into <head>
    this.refresh();

    // Insert each block into container
    for (x = 0; x < gridArray.length; x++) {

        for (y = 0; y < gridArray[x].length; y++) {

            gridBlock = document.createElement('div');
            gridBlock.setAttribute('class', 'grid__block');
            gridBlock.setAttribute('yum-pos-x', x);
            gridBlock.setAttribute('yum-pos-y', y);
            gridBlock.setAttribute('yum-is-block', gridArray[x][y]);

            grid.appendChild(gridBlock);

        }

    }

    // === EVENT LISTENERS ===

    // When user clicks on square block
    grid.addEventListener('click', function(event) {

        event.preventDefault();
        event.stopImmediatePropagation();

        var gridBlock   = event.target,
            isBlock     = parseInt(gridBlock.getAttribute('yum-is-block')),
            gridTotal   = parseInt(gridBlock.getAttribute('yum-connected-total')) || 0,
            spanElem    = gridBlock.querySelector('span');
        
        if (!isBlock || spanElem) return;

        spanElem = document.createElement('span');    
        spanElem.innerText = gridTotal;
        gridBlock.appendChild(spanElem);
        
    });

    // When user moves mouse out of square block
    grid.addEventListener('mouseout', function() {

        var container   = thisRef.settings.container,
            gridBlocks  = this.querySelectorAll('.grid__block--hover');

        // Convert NodeList to Array so forEach will work on certain browsers (i.e. IE)
        Array.prototype.slice.call(gridBlocks, 0).forEach(function(gridBlock) {

            gridBlock.classList.remove('grid__block--hover');

        });

    });

    // When user moves mouse over square block
    grid.addEventListener('mouseover', function(event) {

        event.preventDefault();
        event.stopImmediatePropagation();

        var gridBlock   = event.target,
            gridVisited = [],
            gridTotal   = parseInt(gridBlock.getAttribute('yum-connected-total')) || 0,
            isBlock     = parseInt(gridBlock.getAttribute('yum-is-block')),
            x           = parseInt(gridBlock.getAttribute('yum-pos-x')),
            y           = parseInt(gridBlock.getAttribute('yum-pos-y')),
            hashId      = parseInt(gridBlock.getAttribute('yum-connected-array'));

        // If it's a background element then exit function
        if (!isBlock) return;

        // If `yum-connected-array` has already been set no need to compute
        if (hashId >= 0) {

            gridVisited = thisRef._hash[hashId];

        } else {

            // Compute connected blocks
            gridTotal = thisRef.getConnectedBlocks(x, y, gridVisited);

            // Push into our hash table
            thisRef._hash.push(gridVisited);

            // Create a new id for the set of connected blocks
            hashId = thisRef._hash.length - 1;

        }

        // Loop through visited blocks and add to each connected block
        //  - hover class
        //  - data attributes

        gridVisited.forEach(function(pos) {

            var selector    = '[yum-pos-x="' + pos.x + '"]' +
                              '[yum-pos-y="' + pos.y + '"]',
                gridBlock   = thisRef.settings.container.querySelector(selector);

            gridBlock.classList.add('grid__block--hover');
            gridBlock.setAttribute('yum-connected-total', gridTotal);
            gridBlock.setAttribute('yum-connected-array', hashId);

        });

    });

}

Grid.prototype.getConnectedBlocks = function(x, y, gridVisited, gridArray) {

    // Create a clone of array
    var gridArray = gridArray || JSON.parse(JSON.stringify(this.settings.gridArray));

    // Out of grid array bounds
    if (x < 0 || 
        y < 0 ||
        x >= gridArray.length ||
        y >= gridArray[0].length ||
        gridArray[x][y] <= 0) {
    
        return 0;
    }

    // Current square contains a block
    gridArray[x][y] = -1;
    gridVisited.push({x:x, y:y});   

    return 1 + 
        this.getConnectedBlocks(x + 1, y, gridVisited, gridArray) +
        this.getConnectedBlocks(x - 1, y, gridVisited, gridArray) + 
        this.getConnectedBlocks(x, y + 1, gridVisited, gridArray) +
        this.getConnectedBlocks(x, y - 1, gridVisited, gridArray);
   
}