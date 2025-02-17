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
import { mount } from "src/lib/test_util"
import { WidgetStateManager } from "src/lib/WidgetStateManager"

import { Select as UISelect, TYPE } from "baseui/select"
import { MultiSelect as MultiSelectProto } from "src/autogen/proto"
import { lightTheme } from "src/theme"
import Multiselect, { Props } from "./Multiselect"

const getProps = (elementProps: Partial<MultiSelectProto> = {}): Props => ({
  element: MultiSelectProto.create({
    id: "1",
    label: "Label",
    default: [0],
    options: ["a", "b", "c"],
    ...elementProps,
  }),
  width: 0,
  disabled: false,
  theme: lightTheme.emotion,
  widgetMgr: new WidgetStateManager({
    sendRerunBackMsg: jest.fn(),
    pendingFormsChanged: jest.fn(),
  }),
})

describe("Multiselect widget", () => {
  it("renders without crashing", () => {
    const props = getProps()
    const wrapper = mount(<Multiselect {...props} />)
    expect(wrapper.find(UISelect).length).toBeTruthy()
  })

  it("sets widget value on mount", () => {
    const props = getProps()
    jest.spyOn(props.widgetMgr, "setIntArrayValue")

    mount(<Multiselect {...props} />)
    expect(props.widgetMgr.setIntArrayValue).toHaveBeenCalledWith(
      props.element,
      props.element.default,
      {
        fromUi: false,
      }
    )
  })

  it("has correct className and style", () => {
    const props = getProps()
    const wrapper = mount(<Multiselect {...props} />)
    const wrappedDiv = wrapper.find("div").first()

    const { className, style } = wrappedDiv.props()
    // @ts-ignore
    const splittedClassName = className.split(" ")

    expect(splittedClassName).toContain("row-widget")
    expect(splittedClassName).toContain("stMultiSelect")

    // @ts-ignore
    expect(style.width).toBe(getProps().width)
  })

  it("renders a label", () => {
    const props = getProps()
    const wrapper = mount(<Multiselect {...props} />)
    expect(wrapper.find("StyledWidgetLabel").text()).toBe(props.element.label)
  })

  describe("placeholder", () => {
    it("renders when it's not empty", () => {
      const props = getProps()
      const wrapper = mount(<Multiselect {...props} />)
      expect(wrapper.find(UISelect).prop("placeholder")).toBe(
        "Choose an option"
      )
    })

    it("renders with empty options", () => {
      const props = getProps({ options: [] })
      const wrapper = mount(<Multiselect {...props} />)

      expect(wrapper.find(UISelect).prop("placeholder")).toBe(
        "No options to select."
      )
    })
  })

  it("renders options", () => {
    const props = getProps()
    const wrapper = mount(<Multiselect {...props} />)
    // @ts-ignore
    const options = (wrapper.find(UISelect).prop("options") as string[]) || []

    options.forEach(option => {
      expect(option).toHaveProperty("label")
      expect(option).toHaveProperty("value")
    })

    expect(options.length).toBe(props.element.options.length)
    expect(wrapper.find(UISelect).prop("labelKey")).toBe("label")
    expect(wrapper.find(UISelect).prop("valueKey")).toBe("value")
  })

  it("filters based on label, not value", () => {
    const props = getProps()
    const wrapper = mount(<Multiselect {...props} />)

    const options = wrapper.find(UISelect).prop("options")
    const filterOptionsFn = wrapper.find(UISelect).prop("filterOptions")

    expect(filterOptionsFn(options, "1").length).toEqual(0)
    expect(filterOptionsFn(options, "b").length).toEqual(1)
  })

  it("has multi attr", () => {
    const props = getProps()
    const wrapper = mount(<Multiselect {...props} />)
    expect(wrapper.find(UISelect).prop("multi")).toBeDefined()
  })

  it("has correct type", () => {
    const props = getProps()
    const wrapper = mount(<Multiselect {...props} />)
    expect(wrapper.find(UISelect).prop("type")).toBe(TYPE.select)
  })

  it("can be disabled", () => {
    const props = getProps()
    const wrapper = mount(<Multiselect {...props} />)
    expect(wrapper.find(UISelect).prop("disabled")).toBe(props.disabled)
  })

  it("can select multiple options", () => {
    const props = getProps()
    const wrapper = mount(<Multiselect {...props} />)

    // @ts-ignore
    wrapper.find(UISelect).prop("onChange")({
      type: "select",
      option: {
        value: 1,
      },
    })
    wrapper.update()

    expect(wrapper.find(UISelect).prop("value")).toStrictEqual([
      { label: "a", value: "0" },
      { label: "b", value: "1" },
    ])
  })

  it("can remove options", () => {
    const props = getProps()
    const wrapper = mount(<Multiselect {...props} />)

    // @ts-ignore
    wrapper.find(UISelect).prop("onChange")({
      type: "remove",
      option: {
        value: 1,
      },
    })
    wrapper.update()

    expect(wrapper.find(UISelect).prop("value")).toStrictEqual([
      { label: "a", value: "0" },
    ])
  })

  it("can clear", () => {
    const props = getProps()
    const wrapper = mount(<Multiselect {...props} />)

    // @ts-ignore
    wrapper.find(UISelect).prop("onChange")({ type: "clear" })
    wrapper.update()

    expect(wrapper.find(UISelect).prop("value")).toStrictEqual([])
  })
})
