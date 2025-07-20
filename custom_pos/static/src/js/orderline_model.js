/** @odoo-module */

import { Orderline } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";

patch(Orderline.prototype, {
    getDisplayData() {
        const result = super.getDisplayData();

        // Add brand information to display data
        if (this.product_id && this.product_id.brand_id) {
            if (Array.isArray(this.product_id.brand_id)) {
                // Brand is in [id, name] format
                result.brand_id = {
                    id: this.product_id.brand_id[0],
                    name: this.product_id.brand_id[1]
                };
            } else {
                // Try to get brand from pos store
                const brand = this.pos.get_product_brand_by_id(this.product_id.brand_id);
                result.brand_id = brand || { id: this.product_id.brand_id, name: 'Unknown Brand' };
            }
        }

        return result;
    }
});
