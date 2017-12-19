import { assign, position, toNodes, fastdom, css, Transition, noop, hasClass, removeClass, toggleClass, Promise, win } from '../util/index';

export default {

    props: {
        animation: Number
    },

    defaults: {
        animation: 150
    },

    computed: {

        container() {
            return this.$el;
        },

        children() {
            return toNodes(this.$el.children);
        }
    },

    methods: {

        animate(action, duration = this.animation, visibility = false) {

            const reset = { marginTop: '', position: '', width: '', height: '', pointerEvents: '', top: '', left: '', bottom: '', right: ''};
            const resetSize = { width: '', height: '' };

            const oldContainerBounds = this.container.getBoundingClientRect();

            const tempProps = {
                position: 'absolute',
                pointerEvents: 'none'
            };

            const transFormList = [];

            this.children.forEach(el => {
                const wasVisible = !hasClass(el, 'uk-hidden');
                const oldBounds = wasVisible ? position(el) : null;
                const computed = win.getComputedStyle(el);
                transFormList.push({
                    el,
                    wasVisible,
                    oldBounds,
                    marginTop: computed.getPropertyValue('margin-top'),
                    opacity: visibility ? computed.getPropertyValue('opacity') : ''
                });
            });

            action();
            this.children.forEach(Transition.cancel);
            Transition.cancel(this.container);
            css(this.container, resetSize);
            css(this.children, reset);
            this.$update('update', true);
            fastdom.flush();

            const newContainerBounds = this.container.getBoundingClientRect();

            const showInAnimation = [];
            transFormList.forEach(item => {
                const el = item.el;
                item.willBeVisible = !hasClass(el, 'uk-hidden');

                if (!item.wasVisible && !item.willBeVisible) {
                    item.skip = true;
                    return;
                }

                const marginTop = win.getComputedStyle(el).getPropertyValue('margin-top');
                const bounds = item.willBeVisible ? position(el) : item.oldBounds;

                const oldBounds = item.wasVisible ? item.oldBounds : bounds;

                item.oldCSS = {
                    left: oldBounds.left,
                    top: oldBounds.top,
                    width: oldBounds.width,
                    height: oldBounds.height,
                    marginTop: item.marginTop,
                    opacity: item.opacity
                };

                item.newCSS = {};

                if (visibility) {

                    if (item.wasVisible !== item.willBeVisible) {
                        showInAnimation.push(el);
                    }

                    item.newCSS.opacity = `${item.willBeVisible ? 1 : 0}`;
                }

                assign(item.newCSS, tempProps, {
                    left: bounds.left,
                    top: bounds.top,
                    width: bounds.width,
                    height: bounds.height,
                    marginTop
                });
            });

            showInAnimation.forEach(el => removeClass(el, 'uk-hidden'));

            const animations = transFormList.map(item => {
                if (item.skip) {
                    return;
                }
                const tmpCss = assign({}, tempProps, item.oldCSS);
                css(item.el, tmpCss);

                return Transition.start(item.el, item.newCSS, duration, 'ease');
            });

            const containerAnimation = Transition.start(css(this.container, {width: oldContainerBounds.width, height: oldContainerBounds.height}), {width: newContainerBounds.width, height: newContainerBounds.height}, duration, 'ease', ['height']);

            animations.push(containerAnimation);

            Promise.all(animations).then(() => {

                css(this.container, {width: '', height: ''});
                css(this.children, reset);
                if (visibility) {
                    transFormList.forEach(item => {
                        toggleClass(item.el, 'uk-hidden', !item.willBeVisible);
                    });
                }
                this.$update('update', true);
                fastdom.flush();
            }, noop);

        }
    }
};