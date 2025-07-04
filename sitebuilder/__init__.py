
import importlib
import sys

_module = importlib.import_module("ExPlast.sitebuilder")

_module.__version__ = "0.3.0"

__all__ = list(getattr(_module, "__all__", []))
__all__.append("__version__")

sys.modules[__name__] = _module

