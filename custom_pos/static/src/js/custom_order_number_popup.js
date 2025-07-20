/** @odoo-module */

import { onMounted, useRef, useState } from "@odoo/owl";
import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { _t } from "@web/core/l10n/translation";

export class CustomOrderNumberPopup extends AbstractAwaitablePopup {
    static template = "custom_pos.CustomOrderNumberPopup";
    static defaultProps = {
        confirmText: _t('Confirm'),
        cancelText: _t('Cancel'),
        title: _t('Set Custom Order Number'),
        body: _t('Enter a custom order number for this order:'),
        startingValue: "",
    };

    setup() {
        super.setup();
        this.state = useState({
            inputValue: this.props.startingValue || ''
        });
        this.inputRef = useRef("input");
        onMounted(this.onMounted);
    }

    onMounted() {
        this.inputRef.el.focus();
    }

    getPayload() {
        return this.state.inputValue;
    }
}
