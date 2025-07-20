/** @odoo-module */

import { PosStore } from "@point_of_sale/app/store/pos_store";
import { patch } from "@web/core/utils/patch";

patch(PosStore.prototype, {
    async _processData(loadedData) {
        await super._processData(...arguments);

        // Store brand data
        if (loadedData['product.brand']) {
            this.brands_by_id = {};
            for (const brand of loadedData['product.brand']) {
                this.brands_by_id[brand.id] = brand;
            }
        }

        this.product_temp = loadedData['product.product'];
        console.log('Brands loaded:', this.brands_by_id);
        console.log('Products loaded:', this.product_temp);
    },

    get_product_brand_by_id(id) {
        return this.brands_by_id[id];
    }
});