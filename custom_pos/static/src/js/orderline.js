/** @odoo-module */
import { Orderline } from "@point_of_sale/app/generic_components/orderline/orderline";
import { useService } from "@web/core/utils/hooks";
import { patch } from "@web/core/utils/patch";

patch(Orderline.prototype, {
    setup() {
        super.setup();
        this.pos = useService("pos");
    },

    get brandName() {
        try {
            // Try to get brand from the line's display data first  
            if (this.props.line.brand_id) {
                if (typeof this.props.line.brand_id === 'object' && this.props.line.brand_id.name) {
                    return this.props.line.brand_id.name;
                }
                if (Array.isArray(this.props.line.brand_id)) {
                    return this.props.line.brand_id[1]; // [id, name] format
                }
                return this.props.line.brand_id;
            }

            // Fallback to product brand
            const product = this.props.line.product_id;
            if (product && product.brand_id) {
                if (Array.isArray(product.brand_id)) {
                    return product.brand_id[1]; // [id, name] format
                }

                // If we have the brand ID, try to get from pos store
                if (this.pos && this.pos.get_product_brand_by_id) {
                    const brand = this.pos.get_product_brand_by_id(product.brand_id);
                    return brand ? brand.name : '';
                }
            }

            return '';
        } catch (error) {
            console.error('Error getting brand name:', error);
            return '';
        }
    }
});
