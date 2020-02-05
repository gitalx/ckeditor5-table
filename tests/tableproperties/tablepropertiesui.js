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
import TablePropertiesEditing from '../../src/tableproperties/tablepropertiesediting';
import TablePropertiesUI from '../../src/tableproperties/tablepropertiesui';
import TablePropertiesUIView from '../../src/tableproperties/ui/tablepropertiesview';

describe( 'table properties', () => {
	describe( 'TablePropertiesUI', () => {
		let editor, editorElement, contextualBalloon,
			tablePropertiesUI, tablePropertiesView, tablePropertiesButton;

		testUtils.createSinonSandbox();

		beforeEach( () => {
			editorElement = document.createElement( 'div' );
			document.body.appendChild( editorElement );

			return ClassicTestEditor
				.create( editorElement, {
					plugins: [ Table, TablePropertiesEditing, TablePropertiesUI, Paragraph, Undo ],
					initialData: '<table><tr><td>foo</td></tr></table><p>bar</p>'
				} )
				.then( newEditor => {
					editor = newEditor;

					tablePropertiesUI = editor.plugins.get( TablePropertiesUI );
					tablePropertiesButton = editor.ui.componentFactory.create( 'tableProperties' );
					contextualBalloon = editor.plugins.get( ContextualBalloon );
					tablePropertiesView = tablePropertiesUI.view;

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
			expect( TablePropertiesUI.pluginName ).to.equal( 'TablePropertiesUI' );
		} );

		it( 'should load ContextualBalloon', () => {
			expect( editor.plugins.get( ContextualBalloon ) ).to.be.instanceOf( ContextualBalloon );
		} );

		describe( 'init()', () => {
			it( 'should set a batch', () => {
				expect( tablePropertiesUI._undoStepBatch ).to.be.null;
			} );

			describe( '#view', () => {
				it( 'should be created', () => {
					expect( tablePropertiesUI.view ).to.be.instanceOf( TablePropertiesUIView );
				} );

				it( 'should be rendered', () => {
					expect( tablePropertiesUI.view.isRendered ).to.be.true;
				} );
			} );

			describe( 'toolbar button', () => {
				it( 'should be registered', () => {
					expect( tablePropertiesButton ).to.be.instanceOf( ButtonView );
				} );

				it( 'should have a label', () => {
					expect( tablePropertiesButton.label ).to.equal( 'Table properties' );
				} );

				it( 'should have a tooltip', () => {
					expect( tablePropertiesButton.tooltip ).to.be.true;
				} );

				it( 'should call #_showView upon #execute', () => {
					const spy = testUtils.sinon.stub( tablePropertiesUI, '_showView' ).returns( {} );

					tablePropertiesButton.fire( 'execute' );
					sinon.assert.calledOnce( spy );
				} );
			} );
		} );

		describe( 'destroy()', () => {
			it( 'should destroy the #view', () => {
				const spy = sinon.spy( tablePropertiesView, 'destroy' );

				tablePropertiesUI.destroy();

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
				tablePropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tablePropertiesView );

				tablePropertiesView.fire( 'submit' );
				expect( contextualBalloon.visibleView ).to.be.null;
			} );

			it( 'should undo the entire batch of changes on #cancel', () => {
				// Show the view. New batch will be created.
				tablePropertiesButton.fire( 'execute' );

				// Do the changes like a user.
				tablePropertiesView.borderStyle = 'dotted';
				tablePropertiesView.backgroundColor = 'red';

				expect( getModelData( editor.model ) ).to.equal(
					'<table backgroundColor="red" borderStyle="dotted">' +
						'<tableRow>' +
							'<tableCell>' +
								'<paragraph>[]foo</paragraph>' +
							'</tableCell>' +
						'</tableRow>' +
					'</table>' +
					'<paragraph>bar</paragraph>'
				);

				tablePropertiesView.fire( 'cancel' );

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
				tablePropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tablePropertiesView );

				tablePropertiesView.fire( 'cancel' );
				expect( contextualBalloon.visibleView ).to.be.null;
			} );

			it( 'should hide on the Esc key press', () => {
				const keyEvtData = {
					keyCode: keyCodes.esc,
					preventDefault: sinon.spy(),
					stopPropagation: sinon.spy()
				};

				tablePropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tablePropertiesView );

				tablePropertiesView.keystrokes.press( keyEvtData );
				expect( contextualBalloon.visibleView ).to.be.null;
			} );

			it( 'should hide if the table is no longer selected on EditorUI#update', () => {
				tablePropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tablePropertiesView );

				editor.model.change( writer => {
					// Set selection in the paragraph.
					writer.setSelection( editor.model.document.getRoot().getChild( 1 ), 0 );
				} );

				expect( contextualBalloon.visibleView ).to.be.null;
			} );

			it( 'should reposition if table is still selected on on EditorUI#update', () => {
				tablePropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tablePropertiesView );

				editor.model.change( writer => {
					writer.insertText( 'qux', editor.model.document.selection.getFirstPosition() );
				} );

				expect( contextualBalloon.visibleView ).to.equal( tablePropertiesView );
			} );

			it( 'should hide if clicked outside the balloon', () => {
				tablePropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tablePropertiesView );

				document.body.dispatchEvent( new Event( 'mousedown', { bubbles: true } ) );

				expect( contextualBalloon.visibleView ).to.be.null;
			} );

			describe( 'property changes', () => {
				it( 'should affect the editor state', () => {
					const spy = testUtils.sinon.stub( editor, 'execute' );

					tablePropertiesUI._undoStepBatch = 'foo';
					tablePropertiesView.borderStyle = 'dotted';

					sinon.assert.calledOnce( spy );
					sinon.assert.calledWithExactly( spy, 'tableBorderStyle', { value: 'dotted', batch: 'foo' } );
				} );

				it( 'should not affect the editor state if internal property has changed', () => {
					const spy = testUtils.sinon.stub( editor, 'execute' );

					tablePropertiesView.set( 'internalProp', 'foo' );

					tablePropertiesUI._undoStepBatch = 'foo';
					tablePropertiesView.internalProp = 'bar';

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
				tablePropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tablePropertiesView );

				const firstBatch = tablePropertiesUI._undoStepBatch;
				expect( firstBatch ).to.be.instanceOf( Batch );

				tablePropertiesView.fire( 'submit' );
				expect( contextualBalloon.visibleView ).to.be.null;

				tablePropertiesButton.fire( 'execute' );

				const secondBatch = tablePropertiesUI._undoStepBatch;
				expect( secondBatch ).to.be.instanceOf( Batch );
				expect( firstBatch ).to.not.equal( secondBatch );
			} );

			describe( 'initial data', () => {
				it( 'should be set from the command values', () => {
					editor.commands.get( 'tableBorderStyle' ).value = 'a';
					editor.commands.get( 'tableBorderColor' ).value = 'b';
					editor.commands.get( 'tableBorderWidth' ).value = 'c';
					editor.commands.get( 'tableBackgroundColor' ).value = 'd';
					editor.commands.get( 'tableWidth' ).value = 'e';
					editor.commands.get( 'tableHeight' ).value = 'f';
					editor.commands.get( 'tableAlignment' ).value = 'g';

					tablePropertiesButton.fire( 'execute' );

					expect( contextualBalloon.visibleView ).to.equal( tablePropertiesView );
					expect( tablePropertiesView ).to.include( {
						borderStyle: 'a',
						borderColor: 'b',
						borderWidth: 'c',
						backgroundColor: 'd',
						width: 'e',
						height: 'f',
						alignment: 'g'
					} );
				} );

				it( 'should use default values when command has no value', () => {
					editor.commands.get( 'tableBorderStyle' ).value = null;
					editor.commands.get( 'tableBorderColor' ).value = null;
					editor.commands.get( 'tableBorderWidth' ).value = null;
					editor.commands.get( 'tableBackgroundColor' ).value = null;
					editor.commands.get( 'tableWidth' ).value = null;
					editor.commands.get( 'tableHeight' ).value = null;
					editor.commands.get( 'tableAlignment' ).value = null;

					tablePropertiesButton.fire( 'execute' );

					expect( contextualBalloon.visibleView ).to.equal( tablePropertiesView );
					expect( tablePropertiesView ).to.include( {
						borderStyle: 'none',
						borderColor: '',
						borderWidth: '',
						backgroundColor: '',
						width: '',
						height: '',
						alignment: 'center'
					} );
				} );
			} );

			it( 'should focus the form view', () => {
				const spy = testUtils.sinon.spy( tablePropertiesView, 'focus' );

				tablePropertiesButton.fire( 'execute' );

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
				const spy = testUtils.sinon.spy( tablePropertiesUI, 'stopListening' );

				tablePropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tablePropertiesView );

				tablePropertiesView.fire( 'submit' );
				expect( contextualBalloon.visibleView ).to.be.null;

				sinon.assert.calledOnce( spy );
				sinon.assert.calledWithExactly( spy, editor.ui, 'update' );
			} );

			it( 'should focus the editing view so the focus is not lost', () => {
				const spy = testUtils.sinon.spy( editor.editing.view, 'focus' );

				tablePropertiesButton.fire( 'execute' );
				expect( contextualBalloon.visibleView ).to.equal( tablePropertiesView );

				tablePropertiesView.fire( 'submit' );

				sinon.assert.calledOnce( spy );
			} );
		} );
	} );
} );