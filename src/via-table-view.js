const {Disposable, CompositeDisposable} = require('via');
const etch = require('etch');
const $ = etch.dom;
const _ = require('underscore-plus');

module.exports = class ViaTableView {
    constructor({columns, data, classes}){
        this.disposables = new CompositeDisposable();
        this.columns = columns;
        this.classes = classes || [];

        this.data = data || [];

        // this.initialize(options);
        etch.initialize(this);
    }

    update({data}){
        this.data = data;
        // console.log('Updating table ' + data.length);
        return etch.update(this);
    }

    render(){
        return $.div({classList: 'via-table ' + this.classes.join(' ')}, ...this.data.map(row => $(ViaTableRow, {row, columns: this.columns})));
    }

    initialize(options){
        if(!this.columns || !this.columns.length){
            throw new Error('Tables must include at least one column');
        }

        if(options.headers){
            this.headers = document.createElement('div');
            this.headers.classList.add('table-headers');

            for(let column of this.columns){
                let element = document.createElement('div');
                element.textContent = column.name;

                this.headers.appendChild(element);
            }
        }
    }

    destroy() {
        this.disposables.dispose();
        return etch.destroy(this);
    }

    registerViaCommands() {
        return global.via.commands.add(this.element, {
            'core:move-up': (event) => {
                this.selectPrevious()
                event.stopPropagation()
            },
            'core:move-down': (event) => {
                this.selectNext()
                event.stopPropagation()
            },
            'core:move-to-top': (event) => {
                this.selectFirst()
                event.stopPropagation()
            },
            'core:move-to-bottom': (event) => {
                this.selectLast()
                event.stopPropagation()
            },
            'core:confirm': (event) => {
                this.confirmSelection()
                event.stopPropagation()
            },
            'core:cancel': (event) => {
                this.cancelSelection()
                event.stopPropagation()
            }
        })
    }
}

let count = 0;

class ViaTableRow {
    constructor({row, columns}) {
        this.columns = columns;
        this.row = row;
        etch.initialize(this);
    }

    render(){
        let columns = this.columns.map(c => {
            let classes = '';

            if(_.isFunction(c.classes)){
                classes = c.classes(this.row);
            }else if(_.isString(c.classes)){
                classes = c.classes;
            }

            if(c.accessor){
                return $.div({classList: 'td ' + classes}, c.accessor(this.row) || '-');
            }else if(c.element){
                return c.element(this.row);
            }else{
                return $.div({classList: 'td ' + classes}, '-');
            }
        });

        return $.div({classList: 'tr'}, ...columns);
    }

    update({row}){
        this.row = row;
        etch.update(this);
    }

    mouseDown(event) {
        event.preventDefault()
    }

    mouseUp() {
        event.preventDefault()
    }

    didClick(event) {
        event.preventDefault()
        this.onclick()
    }

    destroy() {
        etch.destroy(this);
    }

    scrollIntoViewIfNeeded() {
        if (this.selected) {
            this.element.scrollIntoViewIfNeeded()
        }
    }
}
