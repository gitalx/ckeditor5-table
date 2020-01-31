/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals Event */

import TableCellPropertiesView from '../../../src/tablecellproperties/ui/tablecellpropertiesview';
import LabeledView from '@ckeditor/ckeditor5-ui/src/labeledview/labeledview';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';
import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker';
import FocusCycler from '@ckeditor/ckeditor5-ui/src/focuscycler';
import ViewCollection from '@ckeditor/ckeditor5-ui/src/viewcollection';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';
import ToolbarView from '@ckeditor/ckeditor5-ui/src/toolbar/toolbarview';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import InputTextView from '@ckeditor/ckeditor5-ui/src/inputtext/inputtextview';

describe( 'table cell properties', () => {
	describe( 'TableCellPropertiesView', () => {
		let view, locale;

		testUtils.createSinonSandbox();

		beforeEach( () => {
			locale = { t: val => val };
			view = new TableCellPropertiesView( locale );
			view.render();
		} );

		afterEach( () => {
			view.destroy();
		} );

		describe( 'constructor()', () => {
			it( 'should set view#locale', () => {
				expect( view.locale ).to.equal( locale );
			} );

			it( 'should create view#children collection', () => {
				expect( view.children ).to.be.instanceOf( ViewCollection );
			} );

			it( 'should define the public data interface (observable properties)', () => {
				expect( view ).to.include( {
					borderStyle: 'none',
					borderWidth: '',
					borderColor: '',
					padding: '',
					backgroundColor: '',
					horizontalAlignment: 'left',
					verticalAlignment: 'middle'
				} );
			} );

			it( 'should create element from template', () => {
				expect( view.element.classList.contains( 'ck' ) ).to.be.true;
				expect( view.element.classList.contains( 'ck-form' ) ).to.be.true;
				expect( view.element.classList.contains( 'ck-table-cell-properties-form' ) ).to.be.true;
				expect( view.element.getAttribute( 'tabindex' ) ).to.equal( '-1' );
			} );

			it( 'should create child views (and references)', () => {
				expect( view.borderStyleDropdown ).to.be.instanceOf( LabeledView );
				expect( view.borderWidthInput ).to.be.instanceOf( LabeledView );
				expect( view.borderColorInput ).to.be.instanceOf( LabeledView );
				expect( view.backgroundInput ).to.be.instanceOf( LabeledView );
				expect( view.paddingInput ).to.be.instanceOf( LabeledView );
				expect( view.horizontalAlignmentToolbar ).to.be.instanceOf( ToolbarView );
				expect( view.verticalAlignmentToolbar ).to.be.instanceOf( ToolbarView );

				expect( view.saveButtonView ).to.be.instanceOf( ButtonView );
				expect( view.cancelButtonView ).to.be.instanceOf( ButtonView );
			} );

			it( 'should have a header', () => {
				const header = view.element.firstChild;

				expect( header.classList.contains( 'ck' ) ).to.be.true;
				expect( header.classList.contains( 'ck-form__header' ) ).to.be.true;
				expect( header.textContent ).to.equal( 'Cell properties' );
			} );

			describe( 'form rows', () => {
				describe( 'border row', () => {
					it( 'should be defined', () => {
						const row = view.element.childNodes[ 1 ];

						expect( row.classList.contains( 'ck-form__row' ) ).to.be.true;
						expect( row.classList.contains( 'ck-table-cell-properties-form__border-row' ) ).to.be.true;
						expect( row.childNodes[ 0 ].textContent ).to.equal( 'Border' );
						expect( row.childNodes[ 1 ] ).to.equal( view.borderStyleDropdown.element );
						expect( row.childNodes[ 2 ] ).to.equal( view.borderColorInput.element );
						expect( row.childNodes[ 3 ] ).to.equal( view.borderWidthInput.element );
					} );

					describe( 'border style labeled dropdown', () => {
						let labeledDropdown;

						beforeEach( () => {
							labeledDropdown = view.borderStyleDropdown;
						} );

						it( 'should have properties set', () => {
							expect(	labeledDropdown.label ).to.equal( 'Style' );
							expect(	labeledDropdown.class ).to.equal( 'ck-table-cell-properties-form__border-style' );
						} );

						it( 'should have a button with properties set', () => {
							expect(	labeledDropdown.view.buttonView.isOn ).to.be.false;
							expect(	labeledDropdown.view.buttonView.withText ).to.be.true;
							expect(	labeledDropdown.view.buttonView.tooltip ).to.equal( 'Style' );
						} );

						it( 'should bind button\'s label to #borderStyle property', () => {
							view.borderStyle = 'dotted';
							expect( labeledDropdown.view.buttonView.label ).to.equal( 'Dotted' );

							view.borderStyle = 'dashed';
							expect( labeledDropdown.view.buttonView.label ).to.equal( 'Dashed' );
						} );

						it( 'should change #borderStyle when executed', () => {
							labeledDropdown.view.listView.items.first.children.first.fire( 'execute' );
							expect( view.borderStyle ).to.equal( 'none' );

							labeledDropdown.view.listView.items.last.children.first.fire( 'execute' );
							expect( view.borderStyle ).to.equal( 'outset' );
						} );

						it( 'should come with a set of pre–defined border styles', () => {
							expect( labeledDropdown.view.listView.items.map( item => {
								return item.children.first.label;
							} ) ).to.have.ordered.members( [
								'None', 'Solid', 'Dotted', 'Dashed', 'Double', 'Groove', 'Ridge', 'Inset', 'Outset',
							] );
						} );
					} );

					describe( 'border width input', () => {
						let labeledInput;

						beforeEach( () => {
							labeledInput = view.borderWidthInput;
						} );

						it( 'should be created', () => {
							expect( labeledInput.view ).to.be.instanceOf( InputTextView );
							expect( labeledInput.label ).to.equal( 'Width' );
							expect( labeledInput.class ).to.equal( 'ck-table-cell-properties-form__border-width' );
						} );

						it( 'should reflect #borderWidth property', () => {
							view.borderWidth = 'foo';
							expect( labeledInput.view.value ).to.equal( 'foo' );

							view.borderWidth = 'bar';
							expect( labeledInput.view.value ).to.equal( 'bar' );
						} );

						it( 'should be enabled only when #borderStyle is different than "none"', () => {
							view.borderStyle = 'none';
							expect( labeledInput.isEnabled ).to.be.false;

							view.borderStyle = 'dotted';
							expect( labeledInput.isEnabled ).to.be.true;
						} );

						it( 'should update #borderWidth on DOM "input" event', () => {
							labeledInput.view.element.value = 'foo';
							labeledInput.view.fire( 'input' );
							expect( view.borderWidth ).to.equal( 'foo' );

							labeledInput.view.element.value = 'bar';
							labeledInput.view.fire( 'input' );
							expect( view.borderWidth ).to.equal( 'bar' );
						} );
					} );

					describe( 'border color input', () => {
						let labeledInput;

						beforeEach( () => {
							labeledInput = view.borderColorInput;
						} );

						it( 'should be created', () => {
							expect( labeledInput.view ).to.be.instanceOf( InputTextView );
							expect( labeledInput.label ).to.equal( 'Color' );
						} );

						it( 'should reflect #borderColor property', () => {
							view.borderColor = 'foo';
							expect( labeledInput.view.value ).to.equal( 'foo' );

							view.borderColor = 'bar';
							expect( labeledInput.view.value ).to.equal( 'bar' );
						} );

						it( 'should be enabled only when #borderStyle is different than "none"', () => {
							view.borderStyle = 'none';
							expect( labeledInput.isEnabled ).to.be.false;

							view.borderStyle = 'dotted';
							expect( labeledInput.isEnabled ).to.be.true;
						} );

						it( 'should update #borderColor on DOM "input" event', () => {
							labeledInput.view.element.value = 'foo';
							labeledInput.view.fire( 'input' );
							expect( view.borderColor ).to.equal( 'foo' );

							labeledInput.view.element.value = 'bar';
							labeledInput.view.fire( 'input' );
							expect( view.borderColor ).to.equal( 'bar' );
						} );
					} );
				} );

				describe( 'background and padding row', () => {
					it( 'should be defined', () => {
						const row = view.element.childNodes[ 2 ];

						expect( row.classList.contains( 'ck-form__row' ) ).to.be.true;
						expect( row.childNodes[ 0 ] ).to.equal( view.backgroundInput.element );
						expect( row.childNodes[ 1 ] ).to.equal( view.paddingInput.element );
					} );

					describe( 'background color input', () => {
						let labeledInput;

						beforeEach( () => {
							labeledInput = view.backgroundInput;
						} );

						it( 'should be created', () => {
							expect( labeledInput.view ).to.be.instanceOf( InputTextView );
							expect( labeledInput.label ).to.equal( 'Background' );
							expect( labeledInput.class ).to.equal( 'ck-table-cell-properties-form__background' );
						} );

						it( 'should reflect #backgroundColor property', () => {
							view.backgroundColor = 'foo';
							expect( labeledInput.view.value ).to.equal( 'foo' );

							view.backgroundColor = 'bar';
							expect( labeledInput.view.value ).to.equal( 'bar' );
						} );

						it( 'should update #backgroundColor on DOM "input" event', () => {
							labeledInput.view.element.value = 'foo';
							labeledInput.view.fire( 'input' );
							expect( view.backgroundColor ).to.equal( 'foo' );

							labeledInput.view.element.value = 'bar';
							labeledInput.view.fire( 'input' );
							expect( view.backgroundColor ).to.equal( 'bar' );
						} );
					} );

					describe( 'padding input', () => {
						let labeledInput;

						beforeEach( () => {
							labeledInput = view.paddingInput;
						} );

						it( 'should be created', () => {
							expect( labeledInput.view ).to.be.instanceOf( InputTextView );
							expect( labeledInput.label ).to.equal( 'Padding' );
							expect( labeledInput.class ).to.equal( 'ck-table-cell-properties-form__padding' );
						} );

						it( 'should reflect #padding property', () => {
							view.padding = 'foo';
							expect( labeledInput.view.value ).to.equal( 'foo' );

							view.padding = 'bar';
							expect( labeledInput.view.value ).to.equal( 'bar' );
						} );

						it( 'should update #padding on DOM "input" event', () => {
							labeledInput.view.element.value = 'foo';
							labeledInput.view.fire( 'input' );
							expect( view.padding ).to.equal( 'foo' );

							labeledInput.view.element.value = 'bar';
							labeledInput.view.fire( 'input' );
							expect( view.padding ).to.equal( 'bar' );
						} );
					} );
				} );

				describe( 'text alignment row', () => {
					it( 'should be defined', () => {
						const row = view.element.childNodes[ 3 ];

						expect( row.classList.contains( 'ck-form__row' ) ).to.be.true;
						expect( row.classList.contains( 'ck-table-cell-properties-form__alignment-row' ) ).to.be.true;
						expect( row.childNodes[ 0 ].textContent ).to.equal( 'Text alignment' );
						expect( row.childNodes[ 1 ] ).to.equal( view.horizontalAlignmentToolbar.element );
						expect( row.childNodes[ 2 ] ).to.equal( view.verticalAlignmentToolbar.element );
					} );

					describe( 'horizontal text alignment toolbar', () => {
						let toolbar;

						beforeEach( () => {
							toolbar = view.horizontalAlignmentToolbar;
						} );

						it( 'should be defined', () => {
							expect( toolbar ).to.be.instanceOf( ToolbarView );
						} );

						it( 'should have an ARIA label', () => {
							expect( toolbar.ariaLabel ).to.equal( 'Horizontal text alignment toolbar' );
						} );

						it( 'should bring alignment buttons', () => {
							expect( toolbar.items.map( ( { label } ) => label ) ).to.have.ordered.members( [
								'Align cell text to the left',
								'Align cell text to the center',
								'Align cell text to the right',
								'Justify cell text',
							] );

							expect( toolbar.items.map( ( { isOn } ) => isOn ) ).to.have.ordered.members( [
								true, false, false, false
							] );
						} );

						it( 'should change the #horizontalAlignment value', () => {
							toolbar.items.last.fire( 'execute' );
							expect( view.horizontalAlignment ).to.equal( 'justify' );
							expect( toolbar.items.last.isOn ).to.be.true;

							toolbar.items.first.fire( 'execute' );
							expect( view.horizontalAlignment ).to.equal( 'left' );
							expect( toolbar.items.last.isOn ).to.be.false;
							expect( toolbar.items.first.isOn ).to.be.true;
						} );
					} );

					describe( 'vertical text alignment toolbar', () => {
						let toolbar;

						beforeEach( () => {
							toolbar = view.verticalAlignmentToolbar;
						} );

						it( 'should be defined', () => {
							expect( toolbar ).to.be.instanceOf( ToolbarView );
						} );

						it( 'should have an ARIA label', () => {
							expect( toolbar.ariaLabel ).to.equal( 'Vertical text alignment toolbar' );
						} );

						it( 'should bring alignment buttons', () => {
							expect( toolbar.items.map( ( { label } ) => label ) ).to.have.ordered.members( [
								'Align cell text to the top',
								'Align cell text to the middle',
								'Align cell text to the bottom',
							] );

							expect( toolbar.items.map( ( { isOn } ) => isOn ) ).to.have.ordered.members( [
								false, true, false
							] );
						} );

						it( 'should change the #verticalAlignment value', () => {
							toolbar.items.last.fire( 'execute' );
							expect( view.verticalAlignment ).to.equal( 'bottom' );
							expect( toolbar.items.last.isOn ).to.be.true;

							toolbar.items.first.fire( 'execute' );
							expect( view.verticalAlignment ).to.equal( 'top' );
							expect( toolbar.items.last.isOn ).to.be.false;
							expect( toolbar.items.first.isOn ).to.be.true;
						} );
					} );
				} );

				describe( 'action row', () => {
					it( 'should be defined', () => {
						const row = view.element.childNodes[ 4 ];

						expect( row.classList.contains( 'ck-form__row' ) ).to.be.true;
						expect( row.classList.contains( 'ck-table-form__action-row' ) ).to.be.true;
						expect( row.childNodes[ 0 ] ).to.equal( view.saveButtonView.element );
						expect( row.childNodes[ 1 ] ).to.equal( view.cancelButtonView.element );
					} );

					it( 'should have buttons with right properties', () => {
						expect( view.saveButtonView.label ).to.equal( 'Save' );
						expect( view.saveButtonView.type ).to.equal( 'submit' );
						expect( view.saveButtonView.withText ).to.be.true;
						expect( view.saveButtonView.class ).to.equal( 'ck-button-save' );

						expect( view.cancelButtonView.label ).to.equal( 'Cancel' );
						expect( view.cancelButtonView.withText ).to.be.true;
						expect( view.cancelButtonView.class ).to.equal( 'ck-button-cancel' );
					} );

					it( 'should make the cancel button fire the #cancel event when executed', () => {
						const spy = sinon.spy();

						view.on( 'cancel', spy );

						view.cancelButtonView.fire( 'execute' );

						expect( spy.calledOnce ).to.be.true;
					} );
				} );
			} );

			it( 'should create #focusTracker instance', () => {
				expect( view.focusTracker ).to.be.instanceOf( FocusTracker );
			} );

			it( 'should create #keystrokes instance', () => {
				expect( view.keystrokes ).to.be.instanceOf( KeystrokeHandler );
			} );

			it( 'should create #_focusCycler instance', () => {
				expect( view._focusCycler ).to.be.instanceOf( FocusCycler );
			} );

			it( 'should create #_focusables view collection', () => {
				expect( view._focusables ).to.be.instanceOf( ViewCollection );
			} );
		} );

		describe( 'render()', () => {
			it( 'should register child views in #_focusables', () => {
				expect( view._focusables.map( f => f ) ).to.have.members( [
					view.borderStyleDropdown,
					view.borderColorInput,
					view.borderWidthInput,
					view.backgroundInput,
					view.paddingInput,
					view.horizontalAlignmentToolbar,
					view.verticalAlignmentToolbar,
					view.saveButtonView,
					view.cancelButtonView
				] );
			} );

			it( 'should register child views\' #element in #focusTracker', () => {
				const spy = testUtils.sinon.spy( FocusTracker.prototype, 'add' );
				const view = new TableCellPropertiesView( { t: val => val } );
				view.render();

				sinon.assert.calledWith( spy, view.borderStyleDropdown.element );
				sinon.assert.calledWith( spy, view.borderColorInput.element );
				sinon.assert.calledWith( spy, view.borderWidthInput.element );
				sinon.assert.calledWith( spy, view.backgroundInput.element );
				sinon.assert.calledWith( spy, view.paddingInput.element );
				sinon.assert.calledWith( spy, view.horizontalAlignmentToolbar.element );
				sinon.assert.calledWith( spy, view.verticalAlignmentToolbar.element );
				sinon.assert.calledWith( spy, view.saveButtonView.element );
				sinon.assert.calledWith( spy, view.cancelButtonView.element );

				view.destroy();
			} );

			it( 'starts listening for #keystrokes coming from #element', () => {
				const view = new TableCellPropertiesView( { t: val => val } );
				const spy = sinon.spy( view.keystrokes, 'listenTo' );

				view.render();
				sinon.assert.calledOnce( spy );
				sinon.assert.calledWithExactly( spy, view.element );
			} );

			describe( 'activates keyboard navigation for the form', () => {
				it( 'so "tab" focuses the next focusable item', () => {
					const keyEvtData = {
						keyCode: keyCodes.tab,
						preventDefault: sinon.spy(),
						stopPropagation: sinon.spy()
					};

					// Mock the border style dropdown button is focused.
					view.focusTracker.isFocused = true;
					view.focusTracker.focusedElement = view.borderStyleDropdown.element;

					const spy = sinon.spy( view.borderColorInput, 'focus' );

					view.keystrokes.press( keyEvtData );
					sinon.assert.calledOnce( keyEvtData.preventDefault );
					sinon.assert.calledOnce( keyEvtData.stopPropagation );
					sinon.assert.calledOnce( spy );
				} );

				it( 'so "shift + tab" focuses the previous focusable item', () => {
					const keyEvtData = {
						keyCode: keyCodes.tab,
						shiftKey: true,
						preventDefault: sinon.spy(),
						stopPropagation: sinon.spy()
					};

					// Mock the border style dropdown button is focused.
					view.focusTracker.isFocused = true;
					view.focusTracker.focusedElement = view.borderStyleDropdown.element;

					const spy = sinon.spy( view.cancelButtonView, 'focus' );

					view.keystrokes.press( keyEvtData );
					sinon.assert.calledOnce( keyEvtData.preventDefault );
					sinon.assert.calledOnce( keyEvtData.stopPropagation );
					sinon.assert.calledOnce( spy );
				} );
			} );
		} );

		describe( 'DOM bindings', () => {
			describe( 'submit event', () => {
				it( 'should trigger submit event', () => {
					const spy = sinon.spy();

					view.on( 'submit', spy );
					view.element.dispatchEvent( new Event( 'submit' ) );

					expect( spy.calledOnce ).to.be.true;
				} );
			} );
		} );

		describe( 'focus()', () => {
			it( 'focuses the #borderStyleDropdown', () => {
				const spy = sinon.spy( view.borderStyleDropdown, 'focus' );

				view.focus();

				sinon.assert.calledOnce( spy );
			} );
		} );
	} );
} );