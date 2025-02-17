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

import { ReactWrapper } from "enzyme"
import React from "react"
import { mount } from "src/lib/test_util"
import { StatefulPopover as UIPopover } from "baseui/popover"
import { ColorPicker as ColorPickerProto } from "src/autogen/proto"
import { WidgetStateManager } from "src/lib/WidgetStateManager"
import { ChromePicker } from "react-color"

import ColorPicker, { Props } from "./ColorPicker"

const getProps = (elementProps: Partial<ColorPickerProto> = {}): Props => ({
  element: ColorPickerProto.create({
    id: "1",
    label: "Label",
    default: "#000000",
    ...elementProps,
  }),
  width: 0,
  disabled: false,
  widgetMgr: new WidgetStateManager({
    sendRerunBackMsg: jest.fn(),
    pendingFormsChanged: jest.fn(),
  }),
})

/** Return the ColorPicker's popover (where the color picking happens). */
function getPopoverWrapper(wrapper: ReactWrapper<ColorPicker>): any {
  // @ts-ignore
  return wrapper.find(UIPopover).renderProp("content")()
}

/** Return the ColorPicker's currently-selected color as a hex string. */
function getPickedColor(wrapper: ReactWrapper<ColorPicker>): string {
  return getPopoverWrapper(wrapper).prop("children").props.color
}

/** Simulate selecting a new color with the ColorPicker's UI. */
function selectColor(wrapper: ReactWrapper<ColorPicker>, color: string): void {
  // Open the popover, select the new color, close the popover.
  wrapper.find(UIPopover).simulate("click")
  getPopoverWrapper(wrapper)
    .find(ChromePicker)
    .prop("onChange")({
    hex: color,
  })
  wrapper.find(UIPopover).simulate("click")
}

describe("ColorPicker widget", () => {
  it("renders without crashing", () => {
    const props = getProps()
    const wrapper = mount(<ColorPicker {...props} />)

    expect(wrapper.find(UIPopover).length).toBe(1)
    expect(getPopoverWrapper(wrapper).find(ChromePicker).length).toBe(1)
  })

  it("sets widget value on mount", () => {
    const props = getProps()
    jest.spyOn(props.widgetMgr, "setStringValue")

    mount(<ColorPicker {...props} />)

    expect(props.widgetMgr.setStringValue).toHaveBeenCalledWith(
      props.element,
      props.element.default,
      { fromUi: false }
    )
  })

  it("renders a default color in the preview and the color picker", () => {
    const props = getProps()
    const wrapper = mount(<ColorPicker {...props} />)

    wrapper.find(UIPopover).simulate("click")

    expect(wrapper.find("StyledColorBlock").prop("style")).toEqual({
      backgroundColor: "#000000",
    })

    expect(getPickedColor(wrapper)).toEqual("#000000")
  })

  it("updates its widget value when it's changed", () => {
    const props = getProps()
    jest.spyOn(props.widgetMgr, "setStringValue")

    const wrapper = mount(<ColorPicker {...props} />)

    const newColor = "#E91E63"
    selectColor(wrapper, newColor)

    // Our widget should be updated.
    expect(getPickedColor(wrapper)).toEqual(newColor)

    // And the WidgetMgr should also be updated.
    expect(
      props.widgetMgr.setStringValue
    ).toHaveBeenLastCalledWith(props.element, newColor, { fromUi: true })
  })
})
