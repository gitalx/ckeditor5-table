/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals document, Event */

import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import { getData as getModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

import Undo from '@ckeditor/ckeditor5-undo/src/undo';
import Batch from '@ckeditor/ckeditor5-engine/src/model/batch';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';

import Table from '../../src/table';
import TableCellPropertiesEditing from '../../src/tablecellproperties/tablecellpropertiesediting';
import TableCellPropertiesUI from '../../src/tablecellproperties/tablecellpropertiesui';
import TableCellPropertiesUIView from '../../src/tablecellproperties/ui/tablecellpropertiesview';

describe( 'table cell properties', () => {
	describe( 'TableCellPropertiesUI', () => {
		let editor, editorElement, contextualBalloon,
			tableCellPropertiesUI, tableCellPropertiesView, tableCellPropertiesButton;

		testUtils.createSinonSandbox();

		beforeEach( () => {
			editorElement = document.createElement( 'div' );
			document.body.appendChild( editorElement );

			return ClassicTestEditor
				.create( editorElement, {
					plugins: [ Table, TableCellPropertiesEditing, TableCellPropertiesUI, Paragraph, Undo ],
					initialData: '<table><tr><td>foo</td></tr></table><p>bar</p>'
				} )
				.then( newEditor => {
					editor = newEditor;

					tableCellPropertiesUI = editor.plugins.get( TableCellPropertiesUI );
					tableCellPropertiesButton = editor.ui.componentFactory.create( 'tableCellProperties' );
					contextualBalloon = editor.plugins.get( ContextualBalloon );
					tableCellPropertiesView = tableCellPropertiesUI.view;

					// There is no point to execute BalloonPanelView attachTo and pin methods so lets override it.
					testUtils.sinon.stub( contextualBalloon.view, 'attachTo' ).returns( {} );
					testUtils.sinon.stub( contextualBalloon.view, 'pin' ).returns( {} );
				} );
		} );

		afterEach( () => {
			editorElement.remove();

			return editor.destroy();
		} );

		it( 'should be named', () => {
			expect( TableCellPropertiesUI.pluginName ).to.equal( 'TableCellPropertiesUI' );
		} );

		it( 'should load ContextualBalloon', () => {
			expect( editor.plugins.get( ContextualBalloon ) ).to.be.instanceOf( ContextualBalloon );
		} );

		describe( 'init()', () => {
			it( 'should set a batch', () => {
				expect( tableCellPropertiesUI._undoStepBatch ).to.be.null;
			} );

			describe( '#view', () => {
				it( 'should be created', () => {
					expect( tableCellPropertiesUI.view ).to.be.instanceOf( TableCellPropertiesUIView );
				} );

				it( 'should be rendered', () => {
					expect( tableCellPropertiesUI.view.isRendered ).to.be.true;
				} );
			} );

			describe( 'toolbar button', () => {
				it( 'should be registered', () => {
					expect( tableCellPropertiesButton ).to.be.instanceOf( ButtonView );
				} );

				it( 'should have a label', () => {
					expect( tableCellPropertiesButton.label ).to.equal( 'Cell properties' );
				} );

				it( 'should have a tooltip', () => {
					expect( tableCellPropertiesButton.tooltip ).to.be.true;
				} );

				it( 'should call #_showView upon #execute', () => {
					const spy = testUtils.sinon.stub( tableCellPropertiesUI, '_showView' ).returns( {} );

					tableCellPropertiesButton.fire( 'execute' );
					sinon.assert.calledOnce( spy );
				} );
			} );
		} );

		describe( 'destroy()', () => {
			it( 'should destroy the #view', () => {
				const spy = sinon.spy( tableCellPropertiesView, 'destroy' );

				tableCellPropertiesUI.destroy();

				sinon.assert.calledOnce( spy );
			} );
		} );

		describe( 'Properties #view', () => {
			beforeEach( () => {
				editor.model.change( writer => {
					writer.setSelection( editor.model.document.getRoot().getChild( 0 ).getChild( 0 ).getChild( 0 ), 0 );
				} );
			} );

			it( 'should hide on #submit', () => {
				tableCellPropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tableCellPropertiesView );

				tableCellPropertiesView.fire( 'submit' );
				expect( contextualBalloon.visibleView ).to.be.null;
			} );

			it( 'should undo the entire batch of changes on #cancel', () => {
				// Show the view. New batch will be created.
				tableCellPropertiesButton.fire( 'execute' );

				// Do the changes like a user.
				tableCellPropertiesView.borderStyle = 'dotted';
				tableCellPropertiesView.backgroundColor = 'red';

				expect( getModelData( editor.model ) ).to.equal(
					'<table>' +
						'<tableRow>' +
							'<tableCell backgroundColor="red" borderStyle="dotted">' +
								'<paragraph>[]foo</paragraph>' +
							'</tableCell>' +
						'</tableRow>' +
					'</table>' +
					'<paragraph>bar</paragraph>'
				);

				tableCellPropertiesView.fire( 'cancel' );

				expect( getModelData( editor.model ) ).to.equal(
					'<table>' +
						'<tableRow>' +
							'<tableCell>' +
								'<paragraph>[]foo</paragraph>' +
							'</tableCell>' +
						'</tableRow>' +
					'</table>' +
					'<paragraph>bar</paragraph>'
				);
			} );

			it( 'should hide on #cancel', () => {
				tableCellPropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tableCellPropertiesView );

				tableCellPropertiesView.fire( 'cancel' );
				expect( contextualBalloon.visibleView ).to.be.null;
			} );

			it( 'should hide on the Esc key press', () => {
				const keyEvtData = {
					keyCode: keyCodes.esc,
					preventDefault: sinon.spy(),
					stopPropagation: sinon.spy()
				};

				tableCellPropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tableCellPropertiesView );

				tableCellPropertiesView.keystrokes.press( keyEvtData );
				expect( contextualBalloon.visibleView ).to.be.null;
			} );

			it( 'should hide if the table cell is no longer selected on EditorUI#update', () => {
				tableCellPropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tableCellPropertiesView );

				editor.model.change( writer => {
					// Set selection in the paragraph.
					writer.setSelection( editor.model.document.getRoot().getChild( 1 ), 0 );
				} );

				expect( contextualBalloon.visibleView ).to.be.null;
			} );

			it( 'should reposition if table cell is still selected on on EditorUI#update', () => {
				tableCellPropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tableCellPropertiesView );

				editor.model.change( writer => {
					writer.insertText( 'qux', editor.model.document.selection.getFirstPosition() );
				} );

				expect( contextualBalloon.visibleView ).to.equal( tableCellPropertiesView );
			} );

			it( 'should hide if clicked outside the balloon', () => {
				tableCellPropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tableCellPropertiesView );

				document.body.dispatchEvent( new Event( 'mousedown', { bubbles: true } ) );

				expect( contextualBalloon.visibleView ).to.be.null;
			} );

			describe( 'property changes', () => {
				it( 'should affect the editor state', () => {
					const spy = testUtils.sinon.stub( editor, 'execute' );

					tableCellPropertiesUI._undoStepBatch = 'foo';
					tableCellPropertiesView.borderStyle = 'dotted';

					sinon.assert.calledOnce( spy );
					sinon.assert.calledWithExactly( spy, 'tableCellBorderStyle', { value: 'dotted', batch: 'foo' } );
				} );

				it( 'should not affect the editor state if internal property has changed', () => {
					const spy = testUtils.sinon.stub( editor, 'execute' );

					tableCellPropertiesView.set( 'internalProp', 'foo' );

					tableCellPropertiesUI._undoStepBatch = 'foo';
					tableCellPropertiesView.internalProp = 'bar';

					sinon.assert.notCalled( spy );
				} );
			} );
		} );

		describe( 'Showing the #view', () => {
			beforeEach( () => {
				editor.model.change( writer => {
					writer.setSelection( editor.model.document.getRoot().getChild( 0 ).getChild( 0 ).getChild( 0 ), 0 );
				} );
			} );

			it( 'should create a new undoable batch for further #view cancel', () => {
				tableCellPropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tableCellPropertiesView );

				const firstBatch = tableCellPropertiesUI._undoStepBatch;
				expect( firstBatch ).to.be.instanceOf( Batch );

				tableCellPropertiesView.fire( 'submit' );
				expect( contextualBalloon.visibleView ).to.be.null;

				tableCellPropertiesButton.fire( 'execute' );

				const secondBatch = tableCellPropertiesUI._undoStepBatch;
				expect( secondBatch ).to.be.instanceOf( Batch );
				expect( firstBatch ).to.not.equal( secondBatch );
			} );

			describe( 'initial data', () => {
				it( 'should be set from the command values', () => {
					editor.commands.get( 'tableCellBorderStyle' ).value = 'a';
					editor.commands.get( 'tableCellBorderColor' ).value = 'b';
					editor.commands.get( 'tableCellBorderWidth' ).value = 'c';
					editor.commands.get( 'tableCellWidth' ).value = 'd';
					editor.commands.get( 'tableCellHeight' ).value = 'e';
					editor.commands.get( 'tableCellPadding' ).value = 'f';
					editor.commands.get( 'tableCellBackgroundColor' ).value = 'g';
					editor.commands.get( 'tableCellHorizontalAlignment' ).value = 'h';
					editor.commands.get( 'tableCellVerticalAlignment' ).value = 'i';

					tableCellPropertiesButton.fire( 'execute' );

					expect( contextualBalloon.visibleView ).to.equal( tableCellPropertiesView );
					expect( tableCellPropertiesView ).to.include( {
						borderStyle: 'a',
						borderColor: 'b',
						borderWidth: 'c',
						width: 'd',
						height: 'e',
						padding: 'f',
						backgroundColor: 'g',
						horizontalAlignment: 'h',
						verticalAlignment: 'i'
					} );
				} );

				it( 'should use default values when command has no value', () => {
					editor.commands.get( 'tableCellBorderStyle' ).value = null;
					editor.commands.get( 'tableCellBorderColor' ).value = null;
					editor.commands.get( 'tableCellBorderWidth' ).value = null;
					editor.commands.get( 'tableCellWidth' ).value = null;
					editor.commands.get( 'tableCellHeight' ).value = null;
					editor.commands.get( 'tableCellPadding' ).value = null;
					editor.commands.get( 'tableCellBackgroundColor' ).value = null;
					editor.commands.get( 'tableCellHorizontalAlignment' ).value = null;
					editor.commands.get( 'tableCellVerticalAlignment' ).value = null;

					tableCellPropertiesButton.fire( 'execute' );

					expect( contextualBalloon.visibleView ).to.equal( tableCellPropertiesView );
					expect( tableCellPropertiesView ).to.include( {
						borderStyle: 'none',
						borderColor: '',
						borderWidth: '',
						width: '',
						height: '',
						padding: '',
						backgroundColor: '',
						horizontalAlignment: 'left',
						verticalAlignment: 'middle'
					} );
				} );
			} );

			it( 'should focus the form view', () => {
				const spy = testUtils.sinon.spy( tableCellPropertiesView, 'focus' );

				tableCellPropertiesButton.fire( 'execute' );

				sinon.assert.calledOnce( spy );
			} );
		} );

		describe( 'Hiding the #view', () => {
			beforeEach( () => {
				editor.model.change( writer => {
					writer.setSelection( editor.model.document.getRoot().getChild( 0 ).getChild( 0 ).getChild( 0 ), 0 );
				} );
			} );

			it( 'should stop listening to EditorUI#update', () => {
				const spy = testUtils.sinon.spy( tableCellPropertiesUI, 'stopListening' );

				tableCellPropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tableCellPropertiesView );

				tableCellPropertiesView.fire( 'submit' );
				expect( contextualBalloon.visibleView ).to.be.null;

				sinon.assert.calledOnce( spy );
				sinon.assert.calledWithExactly( spy, editor.ui, 'update' );
			} );

			it( 'should focus the editing view so the focus is not lost', () => {
				const spy = testUtils.sinon.spy( editor.editing.view, 'focus' );

				tableCellPropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tableCellPropertiesView );

				tableCellPropertiesView.fire( 'submit' );

				sinon.assert.calledOnce( spy );
			} );
		} );
	} );
} );
