/**
 * @license
 * Copyright 2018-2021 Streamlit Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react"
import without from "lodash/without"
import { withTheme } from "emotion-theming"
import { WidgetStateManager, Source } from "src/lib/WidgetStateManager"
import { MultiSelect as MultiSelectProto } from "src/autogen/proto"
import {
  TYPE,
  Select as UISelect,
  Option,
  OnChangeParams,
} from "baseui/select"
import {
  StyledWidgetLabel,
  StyledWidgetLabelHelp,
} from "src/components/widgets/BaseWidget"
import TooltipIcon from "src/components/shared/TooltipIcon"
import { Placement } from "src/components/shared/Tooltip"
import { VirtualDropdown } from "src/components/shared/Dropdown"
import { fuzzyFilterSelectOptions } from "src/components/shared/Dropdown/Selectbox"
import { Theme } from "src/theme"

export interface Props {
  disabled: boolean
  element: MultiSelectProto
  theme: Theme
  widgetMgr: WidgetStateManager
  width: number
}

interface State {
  /**
   * The value specified by the user via the UI.
   */
  value: number[]
}

interface MultiselectOption {
  label: string
  value: string
}

class Multiselect extends React.PureComponent<Props, State> {
  public state: State = {
    value: this.initialValue,
  }

  get initialValue(): number[] {
    // If WidgetStateManager knew a value for this widget, initialize to that.
    // Otherwise, use the default value from the widget protobuf.
    const storedValue = this.props.widgetMgr.getIntArrayValue(
      this.props.element
    )
    return storedValue !== undefined ? storedValue : this.props.element.default
  }

  public componentDidMount(): void {
    this.commitWidgetValue({ fromUi: false })
  }

  /** Commit state.value to the WidgetStateManager. */
  private commitWidgetValue = (source: Source): void => {
    this.props.widgetMgr.setIntArrayValue(
      this.props.element,
      this.state.value,
      source
    )
  }

  private get valueFromState(): MultiselectOption[] {
    return this.state.value.map(i => {
      const label = this.props.element.options[i]
      return { value: i.toString(), label }
    })
  }

  private generateNewState(data: any): State {
    const getIndex = (): number => {
      const valueId = data.option.value
      return parseInt(valueId, 10)
    }

    switch (data.type) {
      case "remove": {
        return { value: without(this.state.value, getIndex()) }
      }
      case "clear": {
        return { value: [] }
      }
      case "select": {
        return { value: this.state.value.concat([getIndex()]) }
      }
      default: {
        throw new Error(`State transition is unkonwn: {data.type}`)
      }
    }
  }

  private onChange = (params: OnChangeParams): void => {
    const newState = this.generateNewState(params)
    this.setState(newState, () => this.commitWidgetValue({ fromUi: true }))
  }

  private filterOptions = (
    options: readonly Option[],
    filterValue: string
  ): readonly Option[] => {
    // We need to manually filter for previously selected options here
    const unselectedOptions = options.filter(
      option => !this.state.value.includes(Number(option.value))
    )

    return fuzzyFilterSelectOptions(
      unselectedOptions as MultiselectOption[],
      filterValue
    )
  }

  public render(): React.ReactNode {
    const { element, theme, width } = this.props
    const style = { width }
    const { options } = element
    const disabled = options.length === 0 ? true : this.props.disabled
    const placeholder =
      options.length === 0 ? "No options to select." : "Choose an option"
    const selectOptions: MultiselectOption[] = options.map(
      (option: string, idx: number) => {
        return {
          label: option,
          value: idx.toString(),
        }
      }
    )

    return (
      <div className="row-widget stMultiSelect" style={style}>
        <StyledWidgetLabel>{element.label}</StyledWidgetLabel>
        {element.help && (
          <StyledWidgetLabelHelp>
            <TooltipIcon
              content={element.help}
              placement={Placement.TOP_RIGHT}
            />
          </StyledWidgetLabelHelp>
        )}
        <UISelect
          options={selectOptions}
          labelKey="label"
          valueKey="value"
          placeholder={placeholder}
          type={TYPE.select}
          multi
          onChange={this.onChange}
          value={this.valueFromState}
          disabled={disabled}
          size={"compact"}
          filterOptions={this.filterOptions}
          overrides={{
            ValueContainer: {
              style: () => ({
                /*
                  This minHeight is needed to fix a bug from BaseWeb in which the
                  div that contains the options changes their height from 40px to 44px.

                  You could check this behavior in their documentation as well:
                  https://v8-17-1.baseweb.design/components/select/#select-as-multi-pick-search

                  Issue related: https://github.com/streamlit/streamlit/issues/590
                 */
                minHeight: "44px",
              }),
            },
            ClearIcon: {
              style: {
                color: theme.colors.darkGray,
              },
            },
            SearchIcon: {
              style: {
                color: theme.colors.darkGray,
              },
            },
            Tag: {
              props: {
                overrides: {
                  Root: {
                    style: {
                      borderTopLeftRadius: theme.radii.md,
                      borderTopRightRadius: theme.radii.md,
                      borderBottomRightRadius: theme.radii.md,
                      borderBottomLeftRadius: theme.radii.md,
                      fontSize: theme.fontSizes.sm,
                      paddingLeft: theme.spacing.md,
                    },
                  },
                  Action: {
                    style: {
                      paddingLeft: theme.spacing.sm,
                    },
                  },
                },
              },
            },
            MultiValue: {
              props: {
                overrides: {
                  Root: {
                    style: {
                      fontSize: theme.fontSizes.sm,
                    },
                  },
                },
              },
            },
            Dropdown: { component: VirtualDropdown },
          }}
        />
      </div>
    )
  }
}

export default withTheme(Multiselect)
