<template>
  <Teleport to="body">
    <BaseModal
      class="modal-host"
      :open="!!top"
      :title="top?.title"
      :focus-key="top?.id"
      :close-on-backdrop="
        top?.kind === 'component' ? top.closeOnBackdrop : true
      "
      :close-on-esc="top?.kind === 'component' ? top.closeOnEsc : true"
      @close="onClose"
    >
      <template v-if="top">
        <component
          :is="top.component"
          v-if="top.kind === 'component'"
          v-bind="top.props"
          @close="onClose"
        />
        <p v-else class="modal-host__text">{{ top.options.text }}</p>
      </template>

      <template #footer>
        <template v-if="top?.kind === 'confirm'">
          <BaseButton
            class="modal-host__btn"
            variant="secondary"
            @click="onClose"
          >
            {{ top.options.cancelLabel ?? 'Отмена' }}
          </BaseButton>
          <BaseButton
            class="modal-host__btn"
            :variant="top.options.variant ?? 'primary'"
            @click="onConfirm"
          >
            {{ top.options.confirmLabel ?? 'Подтвердить' }}
          </BaseButton>
        </template>
      </template>
    </BaseModal>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

const modal = useModal()
const top = computed(() => modal.top())

function onClose(): void {
  modal.close(undefined, false)
}

function onConfirm(): void {
  modal.close(undefined, true)
}
</script>

<style scoped lang="scss">
.modal-host {
  :deep(.modal__footer) {
    flex-wrap: wrap;
  }
  &__text {
    margin: 0;
    color: $color-text;
    line-height: 1.5;
  }
  &__btn {
    @media (max-width: $bp-mobile) {
      width: 100%;
    }
  }
}
</style>
