/* Copyright (C) 2016 NooBaa */

import template from './edit-bucket-trigger-modal.html';
import Observer from 'observer';
import FormViewModel from 'components/form-view-model';
import { state$, action$ } from 'state';
import { closeModal, updateBucketTrigger } from 'action-creators';
import { bucketEvents } from 'utils/bucket-utils';
import { realizeUri } from 'utils/browser-utils';
import { getFunctionOption } from 'utils/func-utils';
import ko from 'knockout';
import * as routes from 'routes';

const formName = 'updateBucketTrigger';

class EditBucketTriggerModalViewModel extends Observer {
    bucketName = '';
    triggerKeys = null;
    form = null;
    isFormReady = ko.observable();
    funcsUrl = ko.observable();
    eventOptions = bucketEvents;
    funcOptions = ko.observableArray();

    constructor({ bucketName, triggerId }) {
        super();

        this.bucketName = ko.unwrap(bucketName);
        this.triggerId = ko.unwrap(triggerId);

        this.observe(
            state$.getMany(
                ['buckets', this.bucketName, 'triggers'],
                'functions',
                'accounts',
                ['location', 'params', 'system'],
            ),
            this.onState
        );

    }

    onState([triggers, funcs, accounts, system]) {
        if (!triggers || !funcs || !accounts) {
            this.isFormReady(false);
            return;
        }

        const trigger = triggers[this.triggerId];
        const existingTriggers = Object.values(triggers)
            .filter(other => other !== trigger);

        const funcsUrl = realizeUri(routes.funcs, { system: system });
        const funcOptions = Object.values(funcs)
            .map(func => getFunctionOption(func, accounts, this.bucketName));


        this.funcsUrl(funcsUrl);
        this.funcOptions(funcOptions);

        if (!this.isFormReady()) {
            // Dropdown compare values by idnetity so we need to find
            // the object set in the options list that have the same name and version
            // as the one in the trigger state.
            const selectedOption = funcOptions.find(opt =>
                opt.value.name === trigger.func.name &&
                opt.value.version === trigger.func.version
            );

            this.form = new FormViewModel({
                name: formName,
                fields: {
                    func: selectedOption ? selectedOption.value : null,
                    event: trigger.event,
                    prefix: trigger.prefix,
                    suffix: trigger.suffix,
                    active: trigger.mode !== 'DISABLED'
                },
                onValidate: this.onValidate.bind(this),
                onValidateSubmit: values => this.onValidateSubmit(values, existingTriggers),
                onSubmit: this.onSubmit.bind(this)
            });
            this.isFormReady(true);
        }
    }

    onValidate(values) {
        const errors = {};
        const { event, func } = values;

        if (!func) {
            errors.func = 'Please select a function';
        }

        if (!event) {
            errors.event = 'Please select an event type';
        }

        return errors;
    }

    async onValidateSubmit(values, existingTriggers) {
        const errors = {};
        const { event, func, prefix, suffix } = values;

        const unique = existingTriggers
                .every(trigger =>
                    trigger.event !== event ||
                    trigger.func.name !== func.name ||
                    trigger.func.version !== func.version ||
                    trigger.prefix !== prefix ||
                    trigger.suffix !== suffix
                );

        if (!unique) {
            errors.event = errors.func = errors.prefix = errors.suffix = ' ';
            errors.global = 'A trigger with the same setting already exists';
        }

        return errors;
    }

    onSubmit(values) {
        const config = {
            funcName: values.func.name,
            funcVersion: values.func.version,
            event: values.event,
            prefix: values.prefix,
            suffix: values.suffix,
            enabled: values.active
        };

        action$.onNext(updateBucketTrigger(this.bucketName, this.triggerId, config));
        action$.onNext(closeModal());
    }

    onCancel() {
        action$.onNext(closeModal());
    }

    dispose() {
        this.form && this.form.dispose();
        super.dispose();
    }
}

export default {
    viewModel: EditBucketTriggerModalViewModel,
    template: template
};