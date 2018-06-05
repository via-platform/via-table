const {Disposable, CompositeDisposable, Emitter} = require('via');
const etch = require('etch');
const $ = etch.dom;
const _ = require('underscore-plus');
const uuid = require('uuid/v1');

module.exports = class ViaTableView {
    constructor({columns, data, options, properties, classes}){
        this.emitter = new Emitter();
        this.disposables = new CompositeDisposable();
        this.data = data || [];
        this.columns = new Map();
        this.options = _.extend(options || {}, {headers: true});
        this.uuid = `via-table-${uuid()}`;
        this.properties = _.isFunction(properties) ? properties : () => {};
        this.classes = classes || '';

        this.initialize(columns);
        etch.initialize(this);
    }

    update({columns, data, properties, options}){
        this.data = data;

        if(properties){
            this.properties = _.isFunction(properties) ? properties : () => {};
        }

        this.updateContextMenu();

        return etch.update(this);
    }

    render(){
        const columns = Array.from(this.columns.values());

        return $.div({classList: `via-table ${this.classes} ${this.uuid}`},
            $.div({classList: 'thead toolbar table-header'}, this.headers()),
            $.div({classList: 'tbody table-body'}, this.data.map(row => $(ViaTableRow, {row, columns, properties: this.properties(row)})))
        );
    }

    headers(){
        const columns = Array.from(this.columns.values());

        return columns.map(col => {
            if(!col.visible) return '';

            const title = _.isFunction(col.title) ? col.title() : col.title;
            const description = _.isFunction(col.description) ? col.description() : col.description;

            return $.div({classList: 'td table-header', title: description}, title);
        });
    }

    toggle(column){
        if(this.columns.has(column.id)){
            const col = this.columns.get(column.id);
            col.visible = !col.visible;
            this.emitter.emit('did-toggle-column', {column, visible: col.visible});
            this.updateContextMenu();
            etch.update(this);
        }
    }

    sort(column, direction){
        if(this.columns.has(column)){
            const col = this.columns.get('column');

            if(col.sort !== direction){
                col.sort = direction;
                this.emitter.emit('did-sort-column', {column, direction});
                etch.update(this);
            }
        }
    }

    initialize(columns){
        for(const col of columns){
            const name = col.name;
            const existing = this.columns.get(col.name);
            const def = !!col.default;
            const visible = existing ? existing.visible : def;
            const sort = existing ? existing.sort : undefined;

            this.columns.set(col.name, _.defaults({}, col, {visible, sort, def, classes: '', description: '', title: col.title}));
        }

        this.updateContextMenu();
    }

    updateContextMenu(){
        const columns = Array.from(this.columns.values());
        const itemsBySelector = {};
        const items = columns.map(column => {
            const label = _.isFunction(column.title) ? column.title() : column.title;

            return {
                label,
                click: this.toggle.bind(this),
                type: 'checkbox',
                checked: column.visible,
                id: column.name
            };
        });

        itemsBySelector[`.${this.uuid} .thead`] = [{label: 'Table Columns', enabled: false}].concat(items);

        if(this.menu) this.menu.dispose();
        this.menu = via.contextMenu.add(itemsBySelector);
    }

    destroy(){
        if(this.menu) this.menu.dispose();

        this.columns.clear();
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

class ViaTableRow {
    constructor({row, columns, properties}) {
        this.columns = columns;
        this.row = row;
        this.properties = _.extend({classList: 'tr'}, properties);
        etch.initialize(this);
    }

    render(){
        return $.div(this.properties, this.columns.map(col => {
            if(!col.visible) return '';

            const classes = _.isFunction(col.classes) ? col.classes(this.row) : col.classes;

            if(col.element) return col.element(this.row);
            if(col.accessor) return $.div({classList: `td ${classes}`}, col.accessor(this.row));

            return $.div({classList: `td ${classes}`}, '-');
        }));
    }

    update({row, columns, properties}){
        this.columns = columns;
        this.row = row;
        this.properties = _.extend({classList: 'tr'}, properties);
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
