/** @odoo-module */

import { CustomOrderNumberPopup } from "@custom_pos/js/custom_order_number_popup";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { patch } from "@web/core/utils/patch";

patch(ProductScreen.prototype, {
    async setCustomOrderNumber() {
        const currentOrder = this.pos.get_order();
        const currentCustomNumber = currentOrder.get_custom_order_number();

        const { confirmed, payload } = await this.popup.add(CustomOrderNumberPopup, {
            startingValue: currentCustomNumber,
        });

        if (confirmed) {
            currentOrder.set_custom_order_number(payload);
        }
    }
});
