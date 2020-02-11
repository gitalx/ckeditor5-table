/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module table/tableproperties
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import TablePropertiesEditing from './tableproperties/tablepropertiesediting';
import TablePropertiesUI from './tableproperties/tablepropertiesui';

/**
 * The table properties feature.
 *
 * This is a "glue" plugin which loads the
 * {@link module:table/tableproperties/tablepropertiesediting~TablePropertiesEditing table editing feature} and
 * the {@link module:table/tableproperties/tablepropertiesui~TablePropertiesUI table properties UI feature}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class TableProperties extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'TableProperties';
	}

	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ TablePropertiesEditing, TablePropertiesUI ];
	}
}

/**
 * TODO
 *
 *		const tableConfig = {
 *			tableProperties: {
 *				border: {
 *					colors: [ ... ]
 *				},
 *				backgroundColors: [ ... ]
 *			}
 *		};
 *
 * **Note**: The colors configuration does not impact the data loaded into the editor;
 * it is reflected only in the UI.
 *
 * Read more about configuring toolbar in {@link module:core/editor/editorconfig~EditorConfig#toolbar}.
 *
 * @member {Object} module:table/table~TableConfig#tableProperties
 */
