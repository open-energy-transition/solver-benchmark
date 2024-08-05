import streamlit as st
import streamlit_shadcn_ui as ui
import pandas as pd
import streamlit as st
import pandas as pd
import numpy as np

input18 = [
  {"code": "4.chpl", "time": "1944ms", "mem": "66.2MB", "compiler": "chpl 1.31.0"},
  {"code": "3.chpl", "time": "2115ms", "mem": "66.3MB", "compiler": "chpl 1.31.0"}
]
input18_df = pd.DataFrame(input18)
input15 = [
  {"code": "4.chpl", "time": "191ms", "mem": "36.3MB", "compiler": "chpl 1.31.0"},
  {"code": "3.chpl", "time": "198ms", "mem": "34.3MB", "compiler": "chpl 1.31.0"}
]
input15_df = pd.DataFrame(input15)
input4000 = [
  {"code": "1-m.chpl", "time": "2296ms", "mem": "506.1MB", "compiler": "chpl 1.31.0"},
]
input4000_df = pd.DataFrame(input4000)
input1000 = [
  {"code": "1-m.chpl", "time": "203ms", "mem": "450.8MB", "compiler": "chpl 1.31.0"},
]
input1000_df = pd.DataFrame(input1000)
input250001 = [
  {"code": "1.chpl", "time": "79ms", "mem": "36.5MB", "compiler": "chpl 1.31.0"},
]
input250001_df = pd.DataFrame(input250001)
input100000 = [
  {"code": "1.chpl", "time": "40ms", "mem": "34.5MB", "compiler": "chpl 1.31.0"},
]
input100000_df = pd.DataFrame(input100000)
input2500000 = [
  {"code": "5-m.chpl", "time": "111ms", "mem": "32.4MB", "compiler": "chpl 1.31.0"},
]
input2500000_df = pd.DataFrame(input2500000)
input250000 = [
  {"code": "5.chpl", "time": "29ms", "mem": "32.4MB", "compiler": "chpl 1.31.0"},
]
input250000_df = pd.DataFrame(input250000)

inputQwQ = [
  {"code": "3-m.chpl", "time": "16ms", "mem": "32.8MB", "compiler": "chpl 1.31.0"},
]
inputQwQ_df = pd.DataFrame(inputQwQ)

input2500000_in = [
  {"code": "3-m.chpl", "time": "766ms", "mem": "101.0MB", "compiler": "chpl 1.31.0"},
]
input2500000_in_df = pd.DataFrame(input2500000_in)
input250000_in = [
  {"code": "3-m.chpl", "time": "120ms", "mem": "90.9MB", "compiler": "chpl 1.31.0"},
]
input250000_in_df = pd.DataFrame(input250000_in)
input5000000 = [
  {"code": "2.chpl", "time": "329ms", "mem": "32.8MB", "compiler": "chpl 1.31.0"},
]
input5000000_df = pd.DataFrame(input5000000)
input500000 = [
  {"code": "2.chpl", "time": "51ms", "mem": "32.9MB", "compiler": "chpl 1.31.0"},
]
input500000_df = pd.DataFrame(input500000)
input8000 = [
  {"code": "2.chpl", "time": "452ms", "mem": "34.4MB", "compiler": "chpl 1.31.0"},
]
input8000_df = pd.DataFrame(input8000)
input2000 = [
  {"code": "1.chpl", "time": "1183ms", "mem": "33.0MB", "compiler": "chpl 1.31.0"},
]
input2000_df = pd.DataFrame(input2000)
input500 = [
  {"code": "1.chpl", "time": "311ms", "mem": "33.1MB", "compiler": "chpl 1.31.0"},
]
input500_df = pd.DataFrame(input500)

with ui.card(key="page-container"):
  with ui.element("div", key="page-header", className="bg-pink-800 text-white p-4 mb-4 rounded-sm text-3xl rounded"):
    with ui.element("a", href="/", key="home-link"):
      ui.element("small", className="text-lg", children="Programming Language and compiler")
      ui.element("br")
      ui.element("span", children="Benchmarks")
  
  with ui.element("div", className="block full-width mx-auto"):
    ui.element("h1", className="text-3xl", children="All Chapel benchmarks")
    with ui.element("p", className="py-2"):
      ui.element("span", children="Current benchmark data was generated on ")
      ui.element("span", className="text-pink-800", children="Thu Feb 01 2024")
      ui.element("span", children=", full log can be found ")
      ui.element("a", href="https://github.com/hanabi1224/Programming-Language-Benchmarks/actions/runs/7734656415", className="underline bold text-blue-500", target="_blank", children="HERE")
    with ui.element("p", className="py-2"):
      ui.element("a", href="https://github.com/hanabi1224/Programming-Language-Benchmarks", className="underline bold text-blue-500", target="_blank", children="CONTRIBUTIONS")
      ui.element("span", children=" are WELCOME!")
    with ui.element("div", className="mt-4 text-xs"):
      ui.element("label", className="font-bold", children="CPU INFO:")
      ui.element("span", className="italic", children=" [x86_64][4 cores] AMD EPYC 7763 64-Core Processor (Model 1)")
    with ui.element("div", className="mt-4 text-xs"):
      ui.element("p", className="italic", children="* -m in a file name stands for multi-threading or multi-processing")
      ui.element("p", className="italic", children="* -i in a file name stands for direct intrinsics usage. (Usage of simd intrinsics via libraries is not counted)")
      ui.element("p", className="italic", children="* -ffi in a file name stands for non-stdlib FFI usage")
      ui.element("p", className="italic", children="* (You may find time < time(user) + time(sys) for some non-parallelized programs, the overhead is from GC or JIT compiler, which are allowed to take advantage of multi-cores as that's more close to real-world scenarios.)")
    with ui.element("div", className="mt-4 text-xs"):
      with ui.element("div", className="form-check form-check-inline flex items-center"):
        with ui.element("div", className="inline-block mr-2"):
          ui.element("input", className="form-check-input inline-block", type="checkbox")
        ui.element("label", className="form-check-label inline-block text-gray-500", children="show numbers without parallelization")
      with ui.element("div", className="form-check form-check-inline flex items-center"):
        with ui.element("div", className="inline-block mr-2"):
          ui.element("input", type="checkbox", className="form-check-input inline-block")
        ui.element("label", className="form-check-label inline-block text-gray-500", children="show numbers with parallelization") 

    with ui.element("div", className="mb-4"):
      with ui.element("h2", className="text-2xl my-4 mb-2 underline text-blue-500"):
        ui.element("a", href="/problem/binarytrees", id="binarytrees", children="binarytrees")
      
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 18")
      with ui.element("div"):
        with ui.element("div", className="min-w-full divide-y divide-gray-200"):
          with ui.element("div", className="flex"):
            for column in input18_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
      with ui.element("div", className="bg-white divide-y divide-gray-200"):
        for _, row in input18_df.iterrows():
          with ui.element("div", className="flex"):
            for value in row:
              ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 15")
        with ui.element("div"):
          with ui.element("div", className="min-w-full divide-y divide-gray-200"):
            with ui.element("div", className="flex"):
              for column in input15_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
        with ui.element("div", className="bg-white divide-y divide-gray-200"):
          for _, row in input15_df.iterrows():
            with ui.element("div", className="flex"):
              for value in row:
                ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)

    with ui.element("div", className="mb-4"):
      with ui.element("h2", className="text-2xl my-4 mb-2 underline text-blue-500"):
        ui.element("a", href="/problem/coro-prime-sieve", id="coro-prime-sieve", children="coro-prime-sieve")
      
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 4000")
      with ui.element("div"):
        with ui.element("div", className="min-w-full divide-y divide-gray-200"):
          with ui.element("div", className="flex"):
            for column in input4000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
      with ui.element("div", className="bg-white divide-y divide-gray-200"):
        for _, row in input4000_df.iterrows():
          with ui.element("div", className="flex"):
            for value in row:
              ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 1000")
        with ui.element("div"):
          with ui.element("div", className="min-w-full divide-y divide-gray-200"):
            with ui.element("div", className="flex"):
              for column in input1000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
        with ui.element("div", className="bg-white divide-y divide-gray-200"):
          for _, row in input1000_df.iterrows():
            with ui.element("div", className="flex"):
              for value in row:
                ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)

    with ui.element("div", className="mb-4"):
      with ui.element("h2", className="text-2xl my-4 mb-2 underline text-blue-500"):
        ui.element("a", href="/problem/edigits", id="edigits", children="edigits")
      
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 250001")
      with ui.element("div"):
        with ui.element("div", className="min-w-full divide-y divide-gray-200"):
          with ui.element("div", className="flex"):
            for column in input250001_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
      with ui.element("div", className="bg-white divide-y divide-gray-200"):
        for _, row in input250001_df.iterrows():
          with ui.element("div", className="flex"):
            for value in row:
              ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 100000")
        with ui.element("div"):
          with ui.element("div", className="min-w-full divide-y divide-gray-200"):
            with ui.element("div", className="flex"):
              for column in input100000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
        with ui.element("div", className="bg-white divide-y divide-gray-200"):
          for _, row in input100000_df.iterrows():
            with ui.element("div", className="flex"):
              for value in row:
                ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)

    with ui.element("div", className="mb-4"):
      with ui.element("h2", className="text-2xl my-4 mb-2 underline text-blue-500"):
        ui.element("a", href="/problem/fasta", id="fasta", children="fasta")
      
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 2500000")
      with ui.element("div"):
        with ui.element("div", className="min-w-full divide-y divide-gray-200"):
          with ui.element("div", className="flex"):
            for column in input2500000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
      with ui.element("div", className="bg-white divide-y divide-gray-200"):
        for _, row in input2500000_df.iterrows():
          with ui.element("div", className="flex"):
            for value in row:
              ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 250000")
        with ui.element("div"):
          with ui.element("div", className="min-w-full divide-y divide-gray-200"):
            with ui.element("div", className="flex"):
              for column in input250000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
        with ui.element("div", className="bg-white divide-y divide-gray-200"):
          for _, row in input250000_df.iterrows():
            with ui.element("div", className="flex"):
              for value in row:
                ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)

    with ui.element("div", className="mb-4"):
      with ui.element("h2", className="text-2xl my-4 mb-2 underline text-blue-500"):
        ui.element("a", href="/problem/helloworld", id="helloworld", children="helloworld")
      
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: QwQ")
      with ui.element("div"):
        with ui.element("div", className="min-w-full divide-y divide-gray-200"):
          with ui.element("div", className="flex"):
            for column in inputQwQ_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
      with ui.element("div", className="bg-white divide-y divide-gray-200"):
        for _, row in inputQwQ_df.iterrows():
          with ui.element("div", className="flex"):
            for value in row:
              ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)
    
    with ui.element("div", className="mb-4"):
      with ui.element("h2", className="text-2xl my-4 mb-2 underline text-blue-500"):
        ui.element("a", href="/problem/knucleotide", id="knucleotide", children="knucleotide")
      
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 2500000_in")
      with ui.element("div"):
        with ui.element("div", className="min-w-full divide-y divide-gray-200"):
          with ui.element("div", className="flex"):
            for column in input2500000_in_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
      with ui.element("div", className="bg-white divide-y divide-gray-200"):
        for _, row in input2500000_in_df.iterrows():
          with ui.element("div", className="flex"):
            for value in row:
              ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 250000_in")
        with ui.element("div"):
          with ui.element("div", className="min-w-full divide-y divide-gray-200"):
            with ui.element("div", className="flex"):
              for column in input250000_in_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
        with ui.element("div", className="bg-white divide-y divide-gray-200"):
          for _, row in input250000_in_df.iterrows():
            with ui.element("div", className="flex"):
              for value in row:
                ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)

    with ui.element("div", className="mb-4"):
      with ui.element("h2", className="text-2xl my-4 mb-2 underline text-blue-500"):
        ui.element("a", href="/problem/nbody", id="nbody", children="nbody")
      
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 5000000")
      with ui.element("div"):
        with ui.element("div", className="min-w-full divide-y divide-gray-200"):
          with ui.element("div", className="flex"):
            for column in input5000000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
      with ui.element("div", className="bg-white divide-y divide-gray-200"):
        for _, row in input5000000_df.iterrows():
          with ui.element("div", className="flex"):
            for value in row:
              ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 500000")
        with ui.element("div"):
          with ui.element("div", className="min-w-full divide-y divide-gray-200"):
            with ui.element("div", className="flex"):
              for column in input500000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
        with ui.element("div", className="bg-white divide-y divide-gray-200"):
          for _, row in input500000_df.iterrows():
            with ui.element("div", className="flex"):
              for value in row:
                ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)

    with ui.element("div", className="mb-4"):
      with ui.element("h2", className="text-2xl my-4 mb-2 underline text-blue-500"):
        ui.element("a", href="/problem/pidigits", id="pidigits", children="pidigits")
      
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 8000")
      with ui.element("div"):
        with ui.element("div", className="min-w-full divide-y divide-gray-200"):
          with ui.element("div", className="flex"):
            for column in input8000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
      with ui.element("div", className="bg-white divide-y divide-gray-200"):
        for _, row in input8000_df.iterrows():
          with ui.element("div", className="flex"):
            for value in row:
              ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 4000")
        with ui.element("div"):
          with ui.element("div", className="min-w-full divide-y divide-gray-200"):
            with ui.element("div", className="flex"):
              for column in input4000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
        with ui.element("div", className="bg-white divide-y divide-gray-200"):
          for _, row in input4000_df.iterrows():
            with ui.element("div", className="flex"):
              for value in row:
                ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)

    with ui.element("div", className="mb-4"):
      with ui.element("h2", className="text-2xl my-4 mb-2 underline text-blue-500"):
        ui.element("a", href="/problem/regex-redux", id="regex-redux", children="regex-redux")
      
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 2500000_in")
      with ui.element("div"):
        with ui.element("div", className="min-w-full divide-y divide-gray-200"):
          with ui.element("div", className="flex"):
            for column in input2500000_in_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
      with ui.element("div", className="bg-white divide-y divide-gray-200"):
        for _, row in input2500000_in_df.iterrows():
          with ui.element("div", className="flex"):
            for value in row:
              ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 250000_in")
        with ui.element("div"):
          with ui.element("div", className="min-w-full divide-y divide-gray-200"):
            with ui.element("div", className="flex"):
              for column in input250000_in_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
        with ui.element("div", className="bg-white divide-y divide-gray-200"):
          for _, row in input250000_in_df.iterrows():
            with ui.element("div", className="flex"):
              for value in row:
                ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)

    with ui.element("div", className="mb-4"):
      with ui.element("h2", className="text-2xl my-4 mb-2 underline text-blue-500"):
        ui.element("a", href="/problem/secp256k1", id="secp256k1", children="secp256k1")
      
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 2000")
      with ui.element("div"):
        with ui.element("div", className="min-w-full divide-y divide-gray-200"):
          with ui.element("div", className="flex"):
            for column in input2000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
      with ui.element("div", className="bg-white divide-y divide-gray-200"):
        for _, row in input2000_df.iterrows():
          with ui.element("div", className="flex"):
            for value in row:
              ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 500")
        with ui.element("div"):
          with ui.element("div", className="min-w-full divide-y divide-gray-200"):
            with ui.element("div", className="flex"):
              for column in input500_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
        with ui.element("div", className="bg-white divide-y divide-gray-200"):
          for _, row in input500_df.iterrows():
            with ui.element("div", className="flex"):
              for value in row:
                ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)

    with ui.element("div", className="mb-4"):
      with ui.element("h2", className="text-2xl my-4 mb-2 underline text-blue-500"):
        ui.element("a", href="/problem/spectral-norm", id="spectral-norm", children="spectral-norm")
      
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 8000")
      with ui.element("div"):
        with ui.element("div", className="min-w-full divide-y divide-gray-200"):
          with ui.element("div", className="flex"):
            for column in input8000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
      with ui.element("div", className="bg-white divide-y divide-gray-200"):
        for _, row in input8000_df.iterrows():
          with ui.element("div", className="flex"):
            for value in row:
              ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 4000")
        with ui.element("div"):
          with ui.element("div", className="min-w-full divide-y divide-gray-200"):
            with ui.element("div", className="flex"):
              for column in input4000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
        with ui.element("div", className="bg-white divide-y divide-gray-200"):
          for _, row in input4000_df.iterrows():
            with ui.element("div", className="flex"):
              for value in row:
                ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)
      with ui.element("div", className="mt-4"):
        ui.element("h3", className="text-base font-bold text-red-800", children="Input: 2000")
        with ui.element("div"):
          with ui.element("div", className="min-w-full divide-y divide-gray-200"):
            with ui.element("div", className="flex"):
              for column in input2000_df.columns:
                ui.element("div", className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children=column)
        with ui.element("div", className="bg-white divide-y divide-gray-200"):
          for _, row in input2000_df.iterrows():
            with ui.element("div", className="flex"):
              for value in row:
                ui.element("div", className="flex-1 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children=value)


time_chart_data = pd.DataFrame({
  "n-hourly resolution": [1, 2, 3, 4, 5],
  "1.1.2.dev3": [178, 45, 20, 15, 12],
  "1.5.0.dev0": [170, 40, 17, 13, 10],
  "1.5.2": [160, 35, 37, 10, 5],
  "1.5.3": [165, 38, 35, 13, 8],
})

memory_chart_data = pd.DataFrame({
  "n-hourly resolution": [1, 2, 3, 4, 5],
  "1.1.2.dev3": [580, 370, 340, 320, 300],
  "1.5.0.dev0": [590, 360, 340, 320, 300],
  "1.5.2": [620, 365, 340, 320, 300],
  "1.5.3": [650, 360, 350, 320, 300],
})

st.title("Time")
st.line_chart(time_chart_data, x="n-hourly resolution")

st.title("Memory")
st.line_chart(memory_chart_data, x="n-hourly resolution")