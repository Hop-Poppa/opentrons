// @flow
import * as React from 'react'
import { ContinueModal } from '@opentrons/components'
import { i18n } from '../../localization'
import { Portal } from '../portals/MainPageModalPortal'
import modalStyles from './modal.css'

type Props = {|
  ...$Diff<React.ElementProps<typeof ContinueModal>, { children: * }>,
  close?: boolean,
|}

export function ConfirmDeleteStepModal(props: Props): React.Node {
  const { close, ...continueModalProps } = props
  return (
    <Portal>
      <ContinueModal className={modalStyles.modal} {...continueModalProps}>
        <p>{i18n.t('modal.close_step.body')}</p>
      </ContinueModal>
    </Portal>
  )
}
